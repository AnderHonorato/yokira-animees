// Arquivo: testes/ponta-a-ponta/tema.teste.ts
// Tema claro, escuro e automatico: escolha persistida, sem piscar, e valendo
// tambem pra quem nao tem conta.

import { expect, test } from '@playwright/test';

async function corDeFundo(page: import('@playwright/test').Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test('visitante sem conta consegue trocar o tema', async ({ page }) => {
  await page.goto('/configuracoes');

  // A tela abre sem exigir login, mostrando so a aparencia.
  await expect(page.getByRole('heading', { name: 'Aparência' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Conta' })).toBeHidden();

  await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro');
  const escuro = await corDeFundo(page);

  await page.getByRole('radio', { name: /Claro/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
  expect(await corDeFundo(page)).not.toBe(escuro);
});

test('a escolha sobrevive ao recarregar e vale nas outras paginas', async ({ page }) => {
  await page.goto('/configuracoes');
  await page.getByRole('radio', { name: /Claro/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');

  // Recarrega: quem tem que lembrar e o servidor, pelo cookie.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');

  await page.goto('/catalogo');
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
});

test('o tema ja vem no HTML do servidor — sem piscar', async ({ page }) => {
  await page.goto('/configuracoes');
  await page.getByRole('radio', { name: /Claro/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');

  // Le o HTML cru, antes de qualquer JavaScript rodar. Se o tema fosse aplicado
  // no navegador, aqui viria "escuro" e a pagina pintaria escura antes de clarear.
  const resposta = await page.request.get('/catalogo');
  const html = await resposta.text();
  expect(html).toContain('data-tema="claro"');
  expect(html).toContain('content="#f4f4f7"');
});

test('automatico segue o sistema, nos dois sentidos', async ({ browser }) => {
  const contexto = await browser.newContext({ colorScheme: 'light' });
  const pagina = await contexto.newPage();

  await pagina.goto('/configuracoes');
  await pagina.getByRole('radio', { name: /Automático/ }).check();
  await expect(pagina.locator('html')).toHaveAttribute('data-tema', 'automatico');

  const comSistemaClaro = await corDeFundo(pagina);

  await pagina.emulateMedia({ colorScheme: 'dark' });
  const comSistemaEscuro = await corDeFundo(pagina);

  // O atributo nao muda; quem decide e a media query do CSS.
  await expect(pagina.locator('html')).toHaveAttribute('data-tema', 'automatico');
  expect(comSistemaClaro).not.toBe(comSistemaEscuro);

  await contexto.close();
});

test('escuro continua sendo o padrao de quem nunca escolheu', async ({ browser }) => {
  const contexto = await browser.newContext({ colorScheme: 'light' });
  const pagina = await contexto.newPage();

  await pagina.goto('/');
  // Sistema no claro, mas sem escolha registrada: a marca se apresenta escura.
  await expect(pagina.locator('html')).toHaveAttribute('data-tema', 'escuro');

  await contexto.close();
});

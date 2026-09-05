// Arquivo: testes/ponta-a-ponta/envio-de-episodios.teste.ts
// O envio de video de ponta a ponta, na tela do titulo.
//
// Cobre tres coisas que quebraram de verdade neste projeto:
// 1. corpo acima de 512 KB — o padrao do adapter-node recusava TODO video com 413;
// 2. um arquivo por requisicao — antes o lote era um POST unico e uma queda no meio
//    nao deixava nem os episodios criados;
// 3. o estado do episodio depois do envio, que antes era invisivel.

import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@yokira.local', senha: 'YokiraAdmin#2024' };

/** Bem acima do teto de 512 KB do adapter: com ele ligado, este teste falha. */
const UM_MEGA = 1024 * 1024;

async function entrarComoAdmin(page: Page) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Senha').fill(ADMIN.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
}

test('soltar arquivos na temporada cria os episodios e envia cada um por vez', async ({ page }) => {
  await entrarComoAdmin(page);

  await page.goto('/admin/titulos');
  await page.getByRole('button', { name: 'Novo título' }).click();
  const formaTitulo = page.locator('form[action="?/criar"]');
  await formaTitulo.getByLabel('Nome').fill(`Envio ${Date.now()}`);
  await formaTitulo.getByLabel('Sinopse').fill('Sinopse com folga suficiente para validar.');
  await formaTitulo.getByLabel('Ano').fill('2026');
  await formaTitulo.getByRole('button', { name: 'Criar título' }).click();
  await expect(page).toHaveURL(/\/admin\/titulos\/[a-z0-9]+$/);

  const formaTemporada = page.locator('form[action="?/criarTemporada"]');
  await formaTemporada.getByLabel('Número').fill('1');
  await formaTemporada.getByLabel('Nome da temporada').fill('Primeira temporada');
  await formaTemporada.getByRole('button', { name: 'Adicionar temporada' }).click();
  await expect(page.getByRole('heading', { name: /T1 · Primeira temporada/ })).toBeVisible();

  // Dois arquivos de uma vez: cada um vira um episodio, com o nome do proprio arquivo.
  await page.getByLabel('Soltar os episódios desta temporada — T1').setInputFiles([
    { name: 'abertura.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(UM_MEGA, 1) },
    { name: 'segundo-passo.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(UM_MEGA, 2) }
  ]);

  await expect(page.getByText('1. abertura')).toBeVisible();
  await expect(page.getByText('2. segundo-passo')).toBeVisible();

  // Uma linha por arquivo no painel da fila, e as duas terminam.
  const concluidos = page.locator('.envios-item[data-situacao="concluido"]');
  await expect(concluidos).toHaveCount(2, { timeout: 60_000 });

  // Depois do envio o episodio para de dizer "Sem vídeo": ou esta convertendo, ou
  // ja falhou (nesta suite nao ha ffmpeg), mas nunca some sem deixar rastro.
  await expect(page.getByText('Sem vídeo')).toHaveCount(0);
});

// Arquivo: testes/ponta-a-ponta/carrossel-e-cache.teste.ts
// Arrasto no celular, setas no desktop, expansao no hover e navegacao instantanea.

import { expect, test } from '@playwright/test';

test('a trilha rola na horizontal', async ({ page }) => {
  await page.goto('/');

  const trilha = page.locator('.carrossel-trilha').first();
  await expect(trilha).toBeVisible();

  const inicio = await trilha.evaluate((elemento) => elemento.scrollLeft);
  await trilha.evaluate((elemento) =>
    elemento.scrollBy({ left: 400, behavior: 'instant' as ScrollBehavior })
  );
  const depois = await trilha.evaluate((elemento) => elemento.scrollLeft);

  expect(depois).toBeGreaterThan(inicio);
});

test('as setas do carrossel so existem no desktop', async ({ page }, informacao) => {
  await page.goto('/');
  const seta = page.getByRole('button', { name: /Avançar em Populares/ });

  if (informacao.project.name === 'desktop-1440') {
    await page.locator('.carrossel').first().hover();
    await expect(seta).toBeVisible();

    const trilha = page.locator('.carrossel-trilha').first();
    const antes = await trilha.evaluate((elemento) => elemento.scrollLeft);
    await seta.click();
    await page.waitForTimeout(600);
    expect(await trilha.evaluate((elemento) => elemento.scrollLeft)).toBeGreaterThan(antes);
  } else {
    await expect(seta).toBeHidden();
  }
});

test('o card expande no hover apenas no desktop', async ({ page }, informacao) => {
  test.skip(informacao.project.name !== 'desktop-1440', 'expansão é exclusiva do desktop');

  await page.goto('/');
  await page.locator('.cartao-link').first().hover();

  // 350ms de atraso proposital antes de abrir.
  await expect(page.locator('.expandido').first()).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.expandido-audiencia').first()).toContainText('assistindo agora');
});

test('o catalogo publico e servido em JSON para o cache', async ({ page }) => {
  const resposta = await page.request.get('/api/catalogo');
  expect(resposta.ok()).toBe(true);

  const catalogo = await resposta.json();
  expect(catalogo.trilhas.length).toBeGreaterThanOrEqual(3);
  expect(catalogo.destaques.length).toBeGreaterThan(0);
  expect(resposta.headers()['cache-control']).toContain('stale-while-revalidate');
});

test('voltar para uma pagina ja visitada e instantaneo', async ({ page }) => {
  await page.goto('/');
  // Navegacao pelo proprio roteador (clique num link), que e o caminho que o
  // prefetch e o cache otimizam. `goBack` faria um carregamento completo e mediria
  // o navegador, nao o app.
  await page.locator('a[href="/catalogo"]').first().click();
  await expect(page.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible();

  const inicio = Date.now();
  await page.locator('a[href="/"]').first().click();
  await expect(page.getByRole('heading', { name: 'Populares' })).toBeVisible();
  expect(Date.now() - inicio).toBeLessThan(1500);
});

// Le uma chave do IndexedDB de dentro da pagina. Serve pra provar que o cache
// existe antes de medir a navegacao — sem isso o teste mediria sorte.
async function temNoCache(page: import('@playwright/test').Page, chave: string) {
  return page.evaluate(
    (nomeDaChave) =>
      new Promise<boolean>((resolver) => {
        const pedido = indexedDB.open('yokira-cache', 1);
        pedido.onerror = () => resolver(false);
        pedido.onsuccess = () => {
          const banco = pedido.result;
          if (!banco.objectStoreNames.contains('documentos')) return resolver(false);
          const busca = banco
            .transaction('documentos', 'readonly')
            .objectStore('documentos')
            .get(nomeDaChave);
          busca.onsuccess = () => resolver(busca.result !== undefined);
          busca.onerror = () => resolver(false);
        };
      }),
    chave
  );
}

test('a home pinta do cache mesmo com o servidor lento', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Populares' })).toBeVisible();

  // O `load` grava o catalogo ao passar pela home; so seguimos quando ele existir.
  await expect.poll(() => temNoCache(page, 'catalogo-publico'), { timeout: 15_000 }).toBe(true);

  // Servidor propositalmente travado em 3s. Se a home esperasse o round-trip,
  // ela so pintaria depois disso.
  await page.route('**/api/catalogo', async (rota) => {
    await new Promise((resolver) => setTimeout(resolver, 3000));
    await rota.continue();
  });

  await page.locator('a[href="/catalogo"]').first().click();
  await expect(page.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible();

  const inicio = Date.now();
  await page.locator('a[href="/"]').first().click();
  await expect(page.getByRole('heading', { name: 'Populares' })).toBeVisible();
  const decorrido = Date.now() - inicio;

  // Pintou antes da resposta do servidor chegar — que e a definicao do 5.1.
  expect(decorrido).toBeLessThan(2000);
});

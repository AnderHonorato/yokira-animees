// Arquivo: playwright.config.ts
// Dois projetos: celular de 390px e desktop de 1440px — as duas larguras das telas de referencia.
// Sobe o build de producao na 4100 pra nao brigar com o `npm run dev` que voce deixou aberto na 4000.

import { defineConfig, devices } from '@playwright/test';

const PORTA = Number(process.env.PORTA_TESTE ?? 4100);

// Em maquina normal o Playwright acha o Chromium sozinho (npx playwright install).
// Em ambiente com o navegador pre-instalado em outro caminho, aponte CHROMIUM_EXECUTAVEL.
const executavel = process.env.CHROMIUM_EXECUTAVEL;
const lancamento = executavel ? { executablePath: executavel } : {};

export default defineConfig({
  testDir: 'testes/ponta-a-ponta',
  testMatch: '**/*.teste.ts',
  fullyParallel: true,
  // 60s por teste: o build de producao sobe junto e a maquina de CI e mais lenta que a local.
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'celular-390', use: { ...devices['Pixel 5'], launchOptions: lancamento } },
    {
      name: 'desktop-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: lancamento
      }
    }
  ],
  webServer: {
    command: `npm run build && node build/index.js`,
    port: PORTA,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(PORTA),
      ORIGIN: `http://localhost:${PORTA}`,
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
      NODE_ENV: 'production'
    }
  }
});

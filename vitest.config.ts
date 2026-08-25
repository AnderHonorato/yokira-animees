// Arquivo: vitest.config.ts
// Config separada da do Vite porque o vite.config.ts nao aceita mais a chave `test`.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['testes/unitarios/**/*.teste.ts', 'testes/integracao/**/*.teste.ts'],
    environment: 'node',
    globals: false
  }
});

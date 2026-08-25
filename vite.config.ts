// Arquivo: vite.config.ts
// Porta 4000 fixa (strictPort) pra nao brigar com outros projetos que usam 3000/5173.

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { port: 4000, strictPort: true },
  preview: { port: 4000, strictPort: true }
});

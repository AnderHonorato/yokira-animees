// Arquivo: testes/integracao/preparar-banco.ts
// Cada arquivo de integracao usa um SQLite proprio em arquivo temporario. Banco de verdade,
// nao mock: o que queremos provar aqui e que a persistencia funciona.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../src/lib/servidor/banco/gerado/client.js';

export interface BancoDeTeste {
  banco: PrismaClient;
  encerrar: () => Promise<void>;
}

export function criarBancoDeTeste(): BancoDeTeste {
  const pasta = mkdtempSync(join(tmpdir(), 'yokira-teste-'));
  const url = `file:${join(pasta, 'teste.db')}`;

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe'
  });

  const banco = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  return {
    banco,
    async encerrar() {
      await banco.$disconnect();
      rmSync(pasta, { recursive: true, force: true });
    }
  };
}

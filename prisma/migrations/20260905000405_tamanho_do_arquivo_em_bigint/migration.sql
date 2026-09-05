/*
  Warnings:

  - You are about to alter the column `tamanhoBytes` on the `ArquivoMidia` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArquivoMidia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tamanhoBytes" BIGINT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArquivoMidia_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArquivoMidia" ("caminho", "criadoEm", "episodioId", "id", "tamanhoBytes") SELECT "caminho", "criadoEm", "episodioId", "id", "tamanhoBytes" FROM "ArquivoMidia";
DROP TABLE "ArquivoMidia";
ALTER TABLE "new_ArquivoMidia" RENAME TO "ArquivoMidia";
CREATE INDEX "ArquivoMidia_episodioId_idx" ON "ArquivoMidia"("episodioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

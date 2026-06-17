/*
  Warnings:

  - You are about to drop the column `remanente` on the `SaldoDiaAnterior` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaldoDiaAnterior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jornadaId" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "unidades" INTEGER,
    "jabas" INTEGER,
    "kg" REAL,
    "unidadesSeleccion" INTEGER,
    "jabasSeleccion" INTEGER,
    "kgSeleccion" REAL,
    "unidadesRemanente" INTEGER,
    "jabasRemanente" INTEGER,
    "kgRemanente" REAL,
    CONSTRAINT "SaldoDiaAnterior_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SaldoDiaAnterior" ("id", "jabas", "jornadaId", "sexo", "unidades", "unidadesSeleccion") SELECT "id", "jabas", "jornadaId", "sexo", "unidades", "unidadesSeleccion" FROM "SaldoDiaAnterior";
DROP TABLE "SaldoDiaAnterior";
ALTER TABLE "new_SaldoDiaAnterior" RENAME TO "SaldoDiaAnterior";
CREATE UNIQUE INDEX "SaldoDiaAnterior_jornadaId_sexo_key" ON "SaldoDiaAnterior"("jornadaId", "sexo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

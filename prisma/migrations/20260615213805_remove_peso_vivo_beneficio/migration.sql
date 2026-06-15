/*
  Warnings:

  - You are about to drop the column `pesoBeneficio` on the `Inspeccion` table. All the data in the column will be lost.
  - You are about to drop the column `pesoVivo` on the `Inspeccion` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspeccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "campania" TEXT,
    "nroGuia" TEXT,
    "clienteId" TEXT NOT NULL,
    "plantelId" TEXT,
    "galpon" TEXT,
    "sexo" TEXT,
    "jabas" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "metaPorcentaje" REAL NOT NULL DEFAULT 0.6,
    "observaciones" TEXT,
    "verificadorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inspeccion" ("anio", "campania", "cantidad", "clienteId", "createdAt", "fecha", "galpon", "id", "jabas", "mes", "metaPorcentaje", "nroGuia", "observaciones", "plantelId", "semana", "sexo", "updatedAt", "verificadorId") SELECT "anio", "campania", "cantidad", "clienteId", "createdAt", "fecha", "galpon", "id", "jabas", "mes", "metaPorcentaje", "nroGuia", "observaciones", "plantelId", "semana", "sexo", "updatedAt", "verificadorId" FROM "Inspeccion";
DROP TABLE "Inspeccion";
ALTER TABLE "new_Inspeccion" RENAME TO "Inspeccion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

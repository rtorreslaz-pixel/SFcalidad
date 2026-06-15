-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plantel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT,
    "zona" TEXT,
    "subZona" TEXT,
    "tipoPlantel" TEXT,
    "zonaEvaluacion" TEXT,
    "clienteId" TEXT,
    CONSTRAINT "Plantel_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Plantel" ("clienteId", "codigo", "id", "nombre", "subZona", "tipoPlantel", "zona", "zonaEvaluacion") SELECT "clienteId", "codigo", "id", "nombre", "subZona", "tipoPlantel", "zona", "zonaEvaluacion" FROM "Plantel";
DROP TABLE "Plantel";
ALTER TABLE "new_Plantel" RENAME TO "Plantel";
CREATE UNIQUE INDEX "Plantel_codigo_key" ON "Plantel"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

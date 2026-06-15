-- AlterTable
ALTER TABLE "Inspeccion" ADD COLUMN "jabas" INTEGER;

-- CreateTable
CREATE TABLE "EvaluacionLesion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspeccionId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "muestra" INTEGER NOT NULL DEFAULT 0,
    "sinLesion" INTEGER NOT NULL DEFAULT 0,
    "leve" INTEGER NOT NULL DEFAULT 0,
    "grave" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EvaluacionLesion_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TipoDefecto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_TipoDefecto" ("categoria", "id", "nombre", "orden") SELECT "categoria", "id", "nombre", "orden" FROM "TipoDefecto";
DROP TABLE "TipoDefecto";
ALTER TABLE "new_TipoDefecto" RENAME TO "TipoDefecto";
CREATE UNIQUE INDEX "TipoDefecto_nombre_key" ON "TipoDefecto"("nombre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionLesion_inspeccionId_categoria_sexo_key" ON "EvaluacionLesion"("inspeccionId", "categoria", "sexo");

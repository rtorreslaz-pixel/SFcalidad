/*
  Warnings:

  - You are about to drop the column `cargoResponsableLocal` on the `ApilamientoRegistro` table. All the data in the column will be lost.
  - You are about to drop the column `nombreResponsableLocal` on the `ApilamientoRegistro` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApilamientoRegistro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoRegistro" TEXT NOT NULL,
    "fechaEvaluacion" DATETIME NOT NULL,
    "clienteId" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "verificadorNombre" TEXT NOT NULL,
    "tipoVentilacion" TEXT NOT NULL,
    "cantidadVentiladores" INTEGER,
    "itemsConformes" INTEGER NOT NULL DEFAULT 0,
    "itemsNoConformes" INTEGER NOT NULL DEFAULT 0,
    "itemsNa" INTEGER NOT NULL DEFAULT 0,
    "itemsVn" INTEGER NOT NULL DEFAULT 0,
    "porcentajeCumplimiento" REAL,
    "semaforo" TEXT NOT NULL DEFAULT 'NA',
    "hallazgoCritico" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'FINALIZADO',
    "observacionesGenerales" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApilamientoRegistro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ApilamientoRegistro" ("cantidadVentiladores", "clienteId", "codigoRegistro", "createdAt", "estado", "fechaEvaluacion", "hallazgoCritico", "id", "itemsConformes", "itemsNa", "itemsNoConformes", "itemsVn", "local", "observacionesGenerales", "porcentajeCumplimiento", "semaforo", "tipoVentilacion", "updatedAt", "verificadorNombre") SELECT "cantidadVentiladores", "clienteId", "codigoRegistro", "createdAt", "estado", "fechaEvaluacion", "hallazgoCritico", "id", "itemsConformes", "itemsNa", "itemsNoConformes", "itemsVn", "local", "observacionesGenerales", "porcentajeCumplimiento", "semaforo", "tipoVentilacion", "updatedAt", "verificadorNombre" FROM "ApilamientoRegistro";
DROP TABLE "ApilamientoRegistro";
ALTER TABLE "new_ApilamientoRegistro" RENAME TO "ApilamientoRegistro";
CREATE UNIQUE INDEX "ApilamientoRegistro_codigoRegistro_key" ON "ApilamientoRegistro"("codigoRegistro");
CREATE INDEX "ApilamientoRegistro_fechaEvaluacion_idx" ON "ApilamientoRegistro"("fechaEvaluacion");
CREATE INDEX "ApilamientoRegistro_semaforo_idx" ON "ApilamientoRegistro"("semaforo");
CREATE UNIQUE INDEX "ApilamientoRegistro_clienteId_local_fechaEvaluacion_key" ON "ApilamientoRegistro"("clienteId", "local", "fechaEvaluacion");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

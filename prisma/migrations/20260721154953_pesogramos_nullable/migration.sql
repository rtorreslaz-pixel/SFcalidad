-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RegistroPesoPreventa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantelId" TEXT NOT NULL,
    "campania" TEXT,
    "galpon" TEXT NOT NULL,
    "corral" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "numeroAve" INTEGER NOT NULL,
    "pesoGramos" REAL,
    "fechaHora" DATETIME NOT NULL,
    "complex" TEXT,
    "tipoMuestreo" TEXT NOT NULL DEFAULT 'PREVENTA',
    "edad" INTEGER,
    "linea" TEXT,
    "lote" TEXT,
    "nAvesPorPesada" INTEGER,
    "tieneHematoma" BOOLEAN,
    "tieneDefectoSeleccion" BOOLEAN,
    "gradoPododermatitis" INTEGER,
    "gradoRasguno" INTEGER,
    "pigmentacion" INTEGER,
    "verificadorId" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroPesoPreventa_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPesoPreventa_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RegistroPesoPreventa" ("campania", "categoria", "complex", "corral", "createdAt", "edad", "fechaHora", "galpon", "gradoPododermatitis", "gradoRasguno", "id", "linea", "lote", "nAvesPorPesada", "numeroAve", "pesoGramos", "pigmentacion", "plantelId", "syncedAt", "tieneDefectoSeleccion", "tieneHematoma", "tipoMuestreo", "verificadorId") SELECT "campania", "categoria", "complex", "corral", "createdAt", "edad", "fechaHora", "galpon", "gradoPododermatitis", "gradoRasguno", "id", "linea", "lote", "nAvesPorPesada", "numeroAve", "pesoGramos", "pigmentacion", "plantelId", "syncedAt", "tieneDefectoSeleccion", "tieneHematoma", "tipoMuestreo", "verificadorId" FROM "RegistroPesoPreventa";
DROP TABLE "RegistroPesoPreventa";
ALTER TABLE "new_RegistroPesoPreventa" RENAME TO "RegistroPesoPreventa";
CREATE INDEX "RegistroPesoPreventa_plantelId_galpon_corral_categoria_idx" ON "RegistroPesoPreventa"("plantelId", "galpon", "corral", "categoria");
CREATE INDEX "RegistroPesoPreventa_verificadorId_fechaHora_idx" ON "RegistroPesoPreventa"("verificadorId", "fechaHora");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

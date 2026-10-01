-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GallinaPesada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "despachoId" TEXT NOT NULL,
    "jabas" INTEGER NOT NULL,
    "densidad" INTEGER NOT NULL,
    "pesoDestareGramos" REAL NOT NULL,
    "pesoConAveGramos" REAL NOT NULL,
    "pesoNetoGramos" REAL NOT NULL,
    "unidades" INTEGER NOT NULL,
    "promedioGramos" REAL NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anuladoEn" DATETIME,
    "anuladoPorId" TEXT,
    CONSTRAINT "GallinaPesada_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "GallinaDespacho" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GallinaPesada_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GallinaPesada" ("createdAt", "densidad", "despachoId", "fechaHora", "id", "jabas", "pesoConAveGramos", "pesoDestareGramos", "pesoNetoGramos", "promedioGramos", "unidades") SELECT "createdAt", "densidad", "despachoId", "fechaHora", "id", "jabas", "pesoConAveGramos", "pesoDestareGramos", "pesoNetoGramos", "promedioGramos", "unidades" FROM "GallinaPesada";
DROP TABLE "GallinaPesada";
ALTER TABLE "new_GallinaPesada" RENAME TO "GallinaPesada";
CREATE INDEX "GallinaPesada_despachoId_idx" ON "GallinaPesada"("despachoId");
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
    "anuladoEn" DATETIME,
    "anuladoPorId" TEXT,
    CONSTRAINT "RegistroPesoPreventa_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPesoPreventa_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPesoPreventa_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RegistroPesoPreventa" ("campania", "categoria", "complex", "corral", "createdAt", "edad", "fechaHora", "galpon", "gradoPododermatitis", "gradoRasguno", "id", "linea", "lote", "nAvesPorPesada", "numeroAve", "pesoGramos", "pigmentacion", "plantelId", "syncedAt", "tieneDefectoSeleccion", "tieneHematoma", "tipoMuestreo", "verificadorId") SELECT "campania", "categoria", "complex", "corral", "createdAt", "edad", "fechaHora", "galpon", "gradoPododermatitis", "gradoRasguno", "id", "linea", "lote", "nAvesPorPesada", "numeroAve", "pesoGramos", "pigmentacion", "plantelId", "syncedAt", "tieneDefectoSeleccion", "tieneHematoma", "tipoMuestreo", "verificadorId" FROM "RegistroPesoPreventa";
DROP TABLE "RegistroPesoPreventa";
ALTER TABLE "new_RegistroPesoPreventa" RENAME TO "RegistroPesoPreventa";
CREATE INDEX "RegistroPesoPreventa_plantelId_galpon_corral_categoria_idx" ON "RegistroPesoPreventa"("plantelId", "galpon", "corral", "categoria");
CREATE INDEX "RegistroPesoPreventa_verificadorId_fechaHora_idx" ON "RegistroPesoPreventa"("verificadorId", "fechaHora");
CREATE TABLE "new_SacaPesada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sacaMuestreoId" TEXT NOT NULL,
    "numJabas" INTEGER NOT NULL,
    "pesoBrutoGramos" REAL NOT NULL,
    "pesoNetoGramos" REAL NOT NULL,
    "avesTotal" INTEGER NOT NULL,
    "promedioGramos" REAL NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anuladoEn" DATETIME,
    "anuladoPorId" TEXT,
    CONSTRAINT "SacaPesada_sacaMuestreoId_fkey" FOREIGN KEY ("sacaMuestreoId") REFERENCES "SacaMuestreo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SacaPesada_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SacaPesada" ("avesTotal", "createdAt", "fechaHora", "id", "numJabas", "pesoBrutoGramos", "pesoNetoGramos", "promedioGramos", "sacaMuestreoId") SELECT "avesTotal", "createdAt", "fechaHora", "id", "numJabas", "pesoBrutoGramos", "pesoNetoGramos", "promedioGramos", "sacaMuestreoId" FROM "SacaPesada";
DROP TABLE "SacaPesada";
ALTER TABLE "new_SacaPesada" RENAME TO "SacaPesada";
CREATE INDEX "SacaPesada_sacaMuestreoId_idx" ON "SacaPesada"("sacaMuestreoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- CreateTable
CREATE TABLE "SacaMuestreo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantelId" TEXT NOT NULL,
    "campania" TEXT,
    "galpon" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "complexLote" TEXT,
    "fecha" DATETIME NOT NULL,
    "edad" INTEGER,
    "avesPorJaba" INTEGER NOT NULL,
    "taraGramosPorJaba" REAL NOT NULL,
    "tipoJaba" TEXT,
    "verificadorId" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SacaMuestreo_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SacaMuestreo_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SacaPesada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sacaMuestreoId" TEXT NOT NULL,
    "numJabas" INTEGER NOT NULL,
    "pesoBrutoGramos" REAL NOT NULL,
    "pesoNetoGramos" REAL NOT NULL,
    "avesTotal" INTEGER NOT NULL,
    "promedioGramos" REAL NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SacaPesada_sacaMuestreoId_fkey" FOREIGN KEY ("sacaMuestreoId") REFERENCES "SacaMuestreo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SacaMuestreo_plantelId_galpon_categoria_idx" ON "SacaMuestreo"("plantelId", "galpon", "categoria");

-- CreateIndex
CREATE INDEX "SacaMuestreo_complexLote_idx" ON "SacaMuestreo"("complexLote");

-- CreateIndex
CREATE INDEX "SacaMuestreo_verificadorId_fecha_idx" ON "SacaMuestreo"("verificadorId", "fecha");

-- CreateIndex
CREATE INDEX "SacaPesada_sacaMuestreoId_idx" ON "SacaPesada"("sacaMuestreoId");

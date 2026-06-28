-- AlterTable
ALTER TABLE "User" ADD COLUMN "apiToken" TEXT;

-- CreateTable
CREATE TABLE "RegistroPesoPreventa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantelId" TEXT NOT NULL,
    "galpon" TEXT NOT NULL,
    "corral" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "numeroAve" INTEGER NOT NULL,
    "pesoGramos" REAL NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "tipoMuestreo" TEXT NOT NULL DEFAULT 'PREVENTA',
    "verificadorId" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroPesoPreventa_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPesoPreventa_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RegistroPesoPreventa_plantelId_galpon_corral_categoria_idx" ON "RegistroPesoPreventa"("plantelId", "galpon", "corral", "categoria");

-- CreateIndex
CREATE INDEX "RegistroPesoPreventa_verificadorId_fechaHora_idx" ON "RegistroPesoPreventa"("verificadorId", "fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiToken_key" ON "User"("apiToken");


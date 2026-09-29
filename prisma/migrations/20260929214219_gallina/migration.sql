-- CreateTable
CREATE TABLE "MaterialGallina" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GallinaDespacho" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "guiaReferencia" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "densidad" INTEGER NOT NULL,
    "verificadorId" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GallinaDespacho_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GallinaDespacho_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialGallina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GallinaDespacho_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GallinaPesada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "despachoId" TEXT NOT NULL,
    "jabas" INTEGER NOT NULL,
    "pesoDestareGramos" REAL NOT NULL,
    "pesoConAveGramos" REAL NOT NULL,
    "pesoNetoGramos" REAL NOT NULL,
    "unidades" INTEGER NOT NULL,
    "promedioGramos" REAL NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GallinaPesada_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "GallinaDespacho" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialGallina_codigo_key" ON "MaterialGallina"("codigo");

-- CreateIndex
CREATE INDEX "GallinaDespacho_clienteId_fecha_idx" ON "GallinaDespacho"("clienteId", "fecha");

-- CreateIndex
CREATE INDEX "GallinaDespacho_verificadorId_fecha_idx" ON "GallinaDespacho"("verificadorId", "fecha");

-- CreateIndex
CREATE INDEX "GallinaDespacho_guiaReferencia_idx" ON "GallinaDespacho"("guiaReferencia");

-- CreateIndex
CREATE INDEX "GallinaPesada_despachoId_idx" ON "GallinaPesada"("despachoId");


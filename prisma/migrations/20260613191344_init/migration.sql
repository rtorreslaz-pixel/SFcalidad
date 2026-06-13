-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VERIFICADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Plantel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT,
    "zona" TEXT,
    "subZona" TEXT,
    "tipoPlantel" TEXT,
    "zonaEvaluacion" TEXT,
    "clienteId" TEXT NOT NULL,
    CONSTRAINT "Plantel_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoDefecto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Inspeccion" (
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
    "cantidad" INTEGER NOT NULL,
    "pesoVivo" REAL,
    "pesoBeneficio" REAL,
    "metaPorcentaje" REAL NOT NULL DEFAULT 0.6,
    "observaciones" TEXT,
    "verificadorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DefectoRegistro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspeccionId" TEXT NOT NULL,
    "tipoDefectoId" TEXT NOT NULL,
    "unidades" INTEGER NOT NULL DEFAULT 0,
    "kg" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "DefectoRegistro_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DefectoRegistro_tipoDefectoId_fkey" FOREIGN KEY ("tipoDefectoId") REFERENCES "TipoDefecto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspeccionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Foto_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombre_key" ON "Cliente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Plantel_codigo_key" ON "Plantel"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDefecto_nombre_key" ON "TipoDefecto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DefectoRegistro_inspeccionId_tipoDefectoId_key" ON "DefectoRegistro"("inspeccionId", "tipoDefectoId");

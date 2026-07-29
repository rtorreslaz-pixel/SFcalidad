-- CreateTable
CREATE TABLE "ApilamientoItem" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "bloque" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "referenciaInstructivo" TEXT,
    "permiteNa" BOOLEAN NOT NULL DEFAULT false,
    "permiteVn" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ApilamientoRegistro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoRegistro" TEXT NOT NULL,
    "fechaEvaluacion" DATETIME NOT NULL,
    "horaDescarga" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "local" TEXT,
    "verificadorNombre" TEXT NOT NULL,
    "plantel" TEXT NOT NULL,
    "galpon" TEXT,
    "placaVehiculo" TEXT NOT NULL,
    "cantidadJabas" INTEGER NOT NULL,
    "sexo" TEXT NOT NULL,
    "densidadJaba" INTEGER NOT NULL,
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
    "nombreResponsableLocal" TEXT,
    "cargoResponsableLocal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApilamientoRegistro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApilamientoDetalle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registroId" TEXT NOT NULL,
    "itemCodigo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "observacion" TEXT,
    CONSTRAINT "ApilamientoDetalle_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "ApilamientoRegistro" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApilamientoDetalle_itemCodigo_fkey" FOREIGN KEY ("itemCodigo") REFERENCES "ApilamientoItem" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApilamientoMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registroId" TEXT NOT NULL,
    "detalleId" TEXT,
    "itemCodigo" TEXT,
    "tipo" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "bytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApilamientoMedia_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "ApilamientoRegistro" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApilamientoMedia_detalleId_fkey" FOREIGN KEY ("detalleId") REFERENCES "ApilamientoDetalle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApilamientoAccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registroId" TEXT NOT NULL,
    "itemCodigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "fechaCompromiso" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaCierre" DATETIME,
    "evidenciaCierreUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApilamientoAccion_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "ApilamientoRegistro" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApilamientoAccion_itemCodigo_fkey" FOREIGN KEY ("itemCodigo") REFERENCES "ApilamientoItem" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApilamientoRegistro_codigoRegistro_key" ON "ApilamientoRegistro"("codigoRegistro");

-- CreateIndex
CREATE INDEX "ApilamientoRegistro_fechaEvaluacion_idx" ON "ApilamientoRegistro"("fechaEvaluacion");

-- CreateIndex
CREATE INDEX "ApilamientoRegistro_semaforo_idx" ON "ApilamientoRegistro"("semaforo");

-- CreateIndex
CREATE UNIQUE INDEX "ApilamientoRegistro_clienteId_fechaEvaluacion_placaVehiculo_key" ON "ApilamientoRegistro"("clienteId", "fechaEvaluacion", "placaVehiculo");

-- CreateIndex
CREATE UNIQUE INDEX "ApilamientoDetalle_registroId_itemCodigo_key" ON "ApilamientoDetalle"("registroId", "itemCodigo");

-- CreateIndex
CREATE INDEX "ApilamientoMedia_registroId_idx" ON "ApilamientoMedia"("registroId");

-- CreateIndex
CREATE INDEX "ApilamientoAccion_registroId_idx" ON "ApilamientoAccion"("registroId");

-- CreateIndex
CREATE INDEX "ApilamientoAccion_estado_fechaCompromiso_idx" ON "ApilamientoAccion"("estado", "fechaCompromiso");

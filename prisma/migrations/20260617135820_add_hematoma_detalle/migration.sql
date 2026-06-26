-- CreateTable
CREATE TABLE "HematomaDetalle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspeccionId" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HematomaDetalle_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HematomaDetalle_inspeccionId_grado_ubicacion_key" ON "HematomaDetalle"("inspeccionId", "grado", "ubicacion");

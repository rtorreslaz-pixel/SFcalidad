-- CreateTable
CREATE TABLE "Jornada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "clienteId" TEXT NOT NULL,
    "verificadorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Jornada_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Jornada_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaldoDiaAnterior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jornadaId" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "unidades" INTEGER NOT NULL DEFAULT 0,
    "jabas" INTEGER NOT NULL DEFAULT 0,
    "unidadesSeleccion" INTEGER NOT NULL DEFAULT 0,
    "remanente" INTEGER,
    CONSTRAINT "SaldoDiaAnterior_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

UPDATE "Inspeccion" SET "sexo" = NULL WHERE "sexo" = 'MIXTO';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspeccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jornadaId" TEXT,
    "fecha" DATETIME,
    "anio" INTEGER,
    "mes" INTEGER,
    "semana" INTEGER,
    "campania" TEXT,
    "clienteId" TEXT,
    "verificadorId" TEXT,
    "metaPorcentaje" REAL NOT NULL DEFAULT 0.6,
    "plantelId" TEXT,
    "galpon" TEXT,
    "sexo" TEXT,
    "jabas" INTEGER,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "nroGuia" TEXT,
    "complex" TEXT,
    "observaciones" TEXT,
    "tempPlataforma" REAL,
    "tempCamion" REAL,
    "tempAves" REAL,
    "hematomasCon" INTEGER,
    "hematomasSin" INTEGER,
    "pigNivel0" INTEGER NOT NULL DEFAULT 0,
    "pigNivel1" INTEGER NOT NULL DEFAULT 0,
    "pigNivel2" INTEGER NOT NULL DEFAULT 0,
    "pigNivel3" INTEGER NOT NULL DEFAULT 0,
    "pigNivel4" INTEGER NOT NULL DEFAULT 0,
    "pigNivel5" INTEGER NOT NULL DEFAULT 0,
    "pigNivel6" INTEGER NOT NULL DEFAULT 0,
    "pigNivel7" INTEGER NOT NULL DEFAULT 0,
    "mermaAlaKg" REAL,
    "mermaPiernaKg" REAL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "pasoActual" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeccion_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inspeccion" ("anio", "campania", "cantidad", "clienteId", "createdAt", "fecha", "galpon", "id", "jabas", "mes", "metaPorcentaje", "nroGuia", "observaciones", "plantelId", "semana", "sexo", "updatedAt", "verificadorId") SELECT "anio", "campania", "cantidad", "clienteId", "createdAt", "fecha", "galpon", "id", "jabas", "mes", "metaPorcentaje", "nroGuia", "observaciones", "plantelId", "semana", "sexo", "updatedAt", "verificadorId" FROM "Inspeccion";
DROP TABLE "Inspeccion";
ALTER TABLE "new_Inspeccion" RENAME TO "Inspeccion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SaldoDiaAnterior_jornadaId_sexo_key" ON "SaldoDiaAnterior"("jornadaId", "sexo");

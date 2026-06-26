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
    "promVivo" REAL,
    "promBeneficiado" REAL,
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
    "soloLesionPigmentacion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeccion_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspeccion_plantelId_fkey" FOREIGN KEY ("plantelId") REFERENCES "Plantel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inspeccion" ("anio", "campania", "cantidad", "clienteId", "complex", "createdAt", "estado", "fecha", "galpon", "hematomasCon", "hematomasSin", "id", "jabas", "jornadaId", "mermaAlaKg", "mermaPiernaKg", "mes", "metaPorcentaje", "nroGuia", "observaciones", "pasoActual", "pigNivel0", "pigNivel1", "pigNivel2", "pigNivel3", "pigNivel4", "pigNivel5", "pigNivel6", "pigNivel7", "plantelId", "promBeneficiado", "promVivo", "semana", "sexo", "tempAves", "tempCamion", "tempPlataforma", "updatedAt", "verificadorId") SELECT "anio", "campania", "cantidad", "clienteId", "complex", "createdAt", "estado", "fecha", "galpon", "hematomasCon", "hematomasSin", "id", "jabas", "jornadaId", "mermaAlaKg", "mermaPiernaKg", "mes", "metaPorcentaje", "nroGuia", "observaciones", "pasoActual", "pigNivel0", "pigNivel1", "pigNivel2", "pigNivel3", "pigNivel4", "pigNivel5", "pigNivel6", "pigNivel7", "plantelId", "promBeneficiado", "promVivo", "semana", "sexo", "tempAves", "tempCamion", "tempPlataforma", "updatedAt", "verificadorId" FROM "Inspeccion";
DROP TABLE "Inspeccion";
ALTER TABLE "new_Inspeccion" RENAME TO "Inspeccion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

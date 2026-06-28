-- CreateTable
CREATE TABLE "LiveWeightReading" (
    "verificadorId" TEXT NOT NULL PRIMARY KEY,
    "pesoGramos" REAL NOT NULL,
    "plantelCodigo" TEXT,
    "galpon" TEXT,
    "corral" TEXT,
    "categoria" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveWeightReading_verificadorId_fkey" FOREIGN KEY ("verificadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de pesos estándar por raza, sexo y edad.
-- Alimenta GET /api/mobile/catalogos → pesosEstandar[].
-- Poblar con los datos reales de la hoja STD del Excel del cliente.
CREATE TABLE "PesoEstandar" (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "linea"      TEXT NOT NULL,
    "sexo"       TEXT NOT NULL,
    "edadDias"   INTEGER NOT NULL,
    "pesoGramos" REAL NOT NULL
);

CREATE UNIQUE INDEX "PesoEstandar_linea_sexo_edadDias_key"
    ON "PesoEstandar"("linea", "sexo", "edadDias");

CREATE INDEX "PesoEstandar_linea_sexo_idx"
    ON "PesoEstandar"("linea", "sexo");

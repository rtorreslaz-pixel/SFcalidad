-- Zona de evaluación como atributo del CLIENTE (no del plantel).
ALTER TABLE "Cliente" ADD COLUMN "zonaEvaluacion" TEXT;

-- Backfill desde los archivos (moda por cliente): 22 clientes clasificados.
UPDATE "Cliente" SET "zonaEvaluacion" = 'CD-LIMA' WHERE "nombre" IN (
  'VALENTINA', 'PAOLO CARRILLO', 'AVISUR', 'LUCARVI', 'PASVELA', 'NEGAVISUR',
  'MAMA JULITA', 'VICTOR TOMÁS', 'AKIM', 'AVICOLA CRUZ', 'KILITO', 'JOSMEL',
  'MAMALIDIA', 'VEKITO', 'BALIAN', 'GAYFA'
);

UPDATE "Cliente" SET "zonaEvaluacion" = 'SUR-LIMA' WHERE "nombre" IN (
  'ALEJANDRO', 'LA ENCANTADA', 'JAYO', 'ANTON', 'ALCANTARA', 'CHRISS'
);

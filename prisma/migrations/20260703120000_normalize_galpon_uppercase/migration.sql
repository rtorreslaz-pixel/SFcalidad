-- Normalizar galpon a mayúsculas en toda la tabla Inspeccion
UPDATE "Inspeccion"
SET galpon = UPPER(galpon)
WHERE galpon IS NOT NULL AND galpon != UPPER(galpon);

-- Recalcular complex para los registros afectados
UPDATE "Inspeccion"
SET complex = UPPER(
  COALESCE((SELECT codigo FROM "Plantel" WHERE id = "Inspeccion".plantelId), '') || '-' ||
  COALESCE(campania, '') || '-' ||
  COALESCE(galpon, '') || '-' ||
  CASE sexo WHEN 'MACHO' THEN 'M' WHEN 'HEMBRA' THEN 'H' ELSE '' END || '-' ||
  COALESCE(corral, '')
)
WHERE galpon IS NOT NULL;

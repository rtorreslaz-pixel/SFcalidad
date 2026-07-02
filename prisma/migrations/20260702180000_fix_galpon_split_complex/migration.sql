-- Fix galpon="11DB" → galpon="11D", corral="B" and recompute complex
UPDATE "Inspeccion"
SET
  galpon  = '11D',
  corral  = 'B',
  complex = UPPER(
    COALESCE((SELECT codigo FROM "Plantel" WHERE id = "Inspeccion".plantelId), '') || '-' ||
    COALESCE(campania, '') || '-' ||
    '11D' || '-' ||
    CASE sexo WHEN 'MACHO' THEN 'M' WHEN 'HEMBRA' THEN 'H' ELSE '' END || '-' ||
    'B'
  )
WHERE galpon = '11DB';

-- Fix galpon="1OB" → galpon="10", corral="B" and recompute complex
UPDATE "Inspeccion"
SET
  galpon  = '10',
  corral  = 'B',
  complex = UPPER(
    COALESCE((SELECT codigo FROM "Plantel" WHERE id = "Inspeccion".plantelId), '') || '-' ||
    COALESCE(campania, '') || '-' ||
    '10' || '-' ||
    CASE sexo WHEN 'MACHO' THEN 'M' WHEN 'HEMBRA' THEN 'H' ELSE '' END || '-' ||
    'B'
  )
WHERE galpon = '1OB';

-- Bulk separation of galpon + corral across all Inspeccion records.
-- Historical data was entered as combined "11A" in the galpon field with corral=null.
-- Target format: galpon = numeric identifier (e.g. "11"), corral = letter (e.g. "A").
--
-- Rules:
--   - galpon GLOB '[0-9]*[A-Za-z]'  → has digits then at least one letter
--   - Exclude multi-value entries (galpon LIKE '% Y %')
--   - Exclude decimal entries (galpon LIKE '%.%')
--   - Only process records where corral IS NULL (already-split records are left alone)
--
-- Uses SQLite LTRIM/RTRIM with character sets (no regex functions needed):
--   RTRIM(galpon, 'ABCDE...Z abcde...z ') strips trailing letters+spaces → numeric prefix
--   LTRIM(galpon, '0123456789 ')           strips leading digits+spaces   → letter suffix

-- Step 1: Uppercase any already-split corral values that are lowercase
UPDATE "Inspeccion"
SET corral = UPPER(corral)
WHERE corral IS NOT NULL AND corral != UPPER(corral);

-- Step 2: Trim stray whitespace from galpon
UPDATE "Inspeccion"
SET galpon = TRIM(galpon)
WHERE galpon IS NOT NULL AND galpon != TRIM(galpon);

-- Step 3: Split combined galpon into galpon (numeric) + corral (letter)
UPDATE "Inspeccion"
SET
  corral = UPPER(LTRIM(galpon, '0123456789 ')),
  galpon = RTRIM(galpon, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ')
WHERE
  corral IS NULL
  AND galpon IS NOT NULL
  AND galpon GLOB '[0-9]*[A-Za-z]'
  AND galpon NOT LIKE '%.%'
  AND galpon NOT LIKE '% Y %'
  AND galpon NOT LIKE '%Y%Y%'
  AND LENGTH(LTRIM(galpon, '0123456789 ')) > 0
  AND LENGTH(RTRIM(galpon, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ')) > 0;

-- Step 4: Trim any trailing whitespace left on galpon after split
UPDATE "Inspeccion"
SET galpon = TRIM(galpon)
WHERE galpon IS NOT NULL AND galpon != TRIM(galpon);

-- Step 5: Recompute complex for all records that have galpon or corral
UPDATE "Inspeccion"
SET complex = UPPER(
  COALESCE((SELECT codigo FROM "Plantel" WHERE id = "Inspeccion".plantelId), '') || '-' ||
  COALESCE(campania, '') || '-' ||
  COALESCE(galpon, '') || '-' ||
  CASE sexo WHEN 'MACHO' THEN 'M' WHEN 'HEMBRA' THEN 'H' ELSE '' END || '-' ||
  COALESCE(corral, '')
)
WHERE galpon IS NOT NULL OR corral IS NOT NULL;

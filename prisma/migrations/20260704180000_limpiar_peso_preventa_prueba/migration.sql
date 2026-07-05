-- Elimina los registros de peso preventa de PRUEBA (id 'seed-*') que el seed creaba
-- en cada arranque. Los datos reales del sync de la app Android (UUIDs) no se tocan.
-- Corre una sola vez en el deploy; el seed ya no los recrea.
DELETE FROM "RegistroPesoPreventa" WHERE "id" LIKE 'seed-%';

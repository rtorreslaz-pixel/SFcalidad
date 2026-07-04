-- Fuerza a TODOS los usuarios existentes a establecer una contraseña nueva en su
-- próximo ingreso (cierra el riesgo de la contraseña por defecto). Corre una sola vez;
-- a medida que cada usuario la cambia, mustChangePassword vuelve a false y no se repite.
UPDATE "User" SET "mustChangePassword" = true WHERE "mustChangePassword" = false;

# Spike: migración a SQL Server + Docker

Prueba de concepto **desechable** que demuestra que el modelo de datos de la app
—hoy en SQLite— corre sobre **SQL Server**, y que la app puede **contenerizarse**
con Docker para desplegarse en la infraestructura corporativa (sin Railway).

**No toca producción.** El esquema de producción (`prisma/schema.prisma`, SQLite)
queda intacto. Todo lo de SQL Server vive aquí, en paralelo.

## Resultado (verificado)

✅ Las 15 tablas del modelo se crean en SQL Server 2022.
✅ El cliente Prisma (vía `@prisma/adapter-mssql`) hace **create, createMany,
   count, aggregate, join con include y upsert** contra SQL Server. Todas las
   pruebas pasan.
✅ La app se empaqueta en una imagen Docker.

Evidencia: salida de `smoke-test.mjs` (6/6 pruebas OK) y las 15 tablas listadas
en `INFORMATION_SCHEMA.TABLES`.

## Qué hubo que ajustar para SQL Server (hallazgos)

Esto es lo valioso para la reunión con Arquitectura — son cambios acotados, no
una reescritura:

1. **Longitud de las llaves de texto.** SQL Server limita una llave/índice a 900
   bytes y el default de Prisma para `String` es `NVarChar(1000)` (2000 bytes),
   que reventaría toda PK/único/índice de texto. Se anotó `@db.NVarChar(36)` en
   IDs y llaves foráneas (36 cubre cuid=25 y UUID=36), y longitudes acotadas en
   columnas únicas/indexadas (`token`, `email`, `codigo`, `galpon`, `corral`…).
2. **Caminos de cascada múltiples.** SQL Server no permite que dos rutas de
   borrado en cascada lleguen a la misma tabla. `Inspeccion` llega a `Cliente` y
   `User` de forma directa y también vía `Jornada`; se rompió el ciclo con
   `onDelete: NoAction, onUpdate: NoAction` en esas relaciones. En SQLite era
   implícito; en SQL Server debe ser explícito.
3. **Enums.** Se representan como `NVarChar` corto. El motor no tiene enums
   nativos; a nivel de app el cliente Prisma los mantiene validados. (En la
   migración real se decide si se dejan como texto o con `CHECK`.)
4. **URL de conexión.** En Prisma 7 la URL va en `prisma.config.ts`
   (`datasource.url`), no en el `.prisma`. Se usa la variable
   `DATABASE_URL_SQLSERVER`.
5. **Adaptador de runtime.** SQLite usa `@prisma/adapter-better-sqlite3`; SQL
   Server usa `@prisma/adapter-mssql` (instalado como dependencia). El cambio en
   la app es apuntar `src/lib/db.ts` a ese adaptador.

## Cómo reproducirlo

Requiere Docker.

```bash
# 1. Levantar SQL Server 2022 local
docker compose -f migration-spike/docker-compose.yml up -d

# 2. Crear la base del spike (espera a que el contenedor esté "healthy")
docker exec sf-spike-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Spike_Passw0rd!' -C \
  -Q "IF DB_ID('sanfernando_spike') IS NULL CREATE DATABASE sanfernando_spike;"

# 3. Crear el esquema en SQL Server y generar el cliente
export DATABASE_URL_SQLSERVER='sqlserver://localhost:1433;database=sanfernando_spike;user=sa;password=Spike_Passw0rd!;encrypt=true;trustServerCertificate=true'
npx prisma db push --config migration-spike/prisma.config.ts
npx prisma generate --config migration-spike/prisma.config.ts

# 4. Prueba de humo (escribe y lee datos reales en SQL Server)
npx tsx migration-spike/smoke-test.mjs

# 5. Contenerizar la app
docker build -t sanfernando-calidad .

# Limpieza
docker compose -f migration-spike/docker-compose.yml down -v
```

## Archivos

- `schema.sqlserver.prisma` — esquema de producción adaptado a SQL Server.
- `prisma.config.ts` — config de Prisma solo para el spike.
- `docker-compose.yml` — SQL Server 2022 local desechable.
- `smoke-test.mjs` — prueba de humo del cliente Prisma contra SQL Server.
- `../Dockerfile`, `../.dockerignore` — contenerización de la app web.

## Lo que NO cubre este spike (queda para después de la reunión)

- **SSO / Active Directory** corporativo (proveedor y credenciales).
- **El SQL Server corporativo** real y su red.
- **Lineamientos de control de la información** (retención, auditoría) de Seguridad.
- Convertir el `db:setup` de arranque (hoy activa WAL de SQLite) al flujo de
  `prisma migrate deploy` del motor destino.

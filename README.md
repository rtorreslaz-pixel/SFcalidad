# San Fernando — Calidad en Cliente y Pesaje Preventa en Granja

Aplicación web + API para digitalizar el **control de calidad del pollo en el cliente**
(selección, pigmentación, pododermatitis, rasguños, hematomas, temperatura de transporte)
y el **pesaje preventa en granja** (báscula Bluetooth vía app móvil), reemplazando el
registro manual en Excel. Incluye dashboard de indicadores, monitor de pesaje en vivo y
trazabilidad granja→cliente.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 5**
- **Prisma 7.8** (ORM) sobre **SQLite** (motor actual; ver "Base de datos" abajo)
- **Node.js 22**
- **Tailwind CSS v4** + **Recharts** (gráficos)
- **Sharp** (escáner de pigmentación)
- Autenticación por sesión (token opaco) + **bcrypt**

## Desarrollo local

```bash
npm install                 # postinstall corre `prisma generate`
npx prisma migrate deploy   # crea/actualiza la base SQLite (dev.db)
npx prisma db seed          # catálogos + usuarios de prueba
npm run dev                 # http://localhost:3000
```

Usuarios de prueba (contraseña `demo1234`, piden cambio de clave al primer ingreso):
- `supervisor@avicola.com` (Supervisor) · `jefe@avicola.com` (Jefe)
- `verificador1@avicola.com` … `verificador10@avicola.com` (Verificador)

## Variables de entorno

| Variable | Para qué | Notas |
|---|---|---|
| `DATABASE_URL` | Ruta de la base SQLite | Local: `file:./dev.db` (default). **En producción usa ruta ABSOLUTA** (`file:/data/dev.db` con volumen, o `file:/app/dev.db` sin él). Una ruta relativa falla en el build de producción con `SQLITE_CANTOPEN`. |
| `DISABLE_WAL` | Desactiva el modo WAL de SQLite | Ponlo en `true` cuando la base vive en un **volumen** (Railway). WAL necesita archivos de memoria compartida que los volúmenes no soportan → error `readonly database`. Con `true` usa el journal `DELETE`. |
| `SEED_DEMO` | Siembra datos de demostración | `true` en el despliegue **demo**: llena todas las tablas con datos de prueba realistas al arrancar. |
| `DEMO_MODE` | Modo demostración | `true` muestra un banner "Ambiente de demostración" y mantiene el monitor de pesaje con básculas activas (datos sembrados). |
| `PORT` | Puerto de la app | Railway lo inyecta (normalmente `8080`). La app lo usa vía `next start -p ${PORT:-3000}`. **El dominio público debe apuntar a ese mismo puerto (8080).** |

## Despliegue (Railway)

Railway detecta Next.js (Nixpacks) y corre `npm install` → `npm run build` → `npm start`.
`npm start` ejecuta `db:setup` (migraciones + `journal_mode` + seed) y luego `next start`.

**Lecciones aprendidas (importante):**
- **No dejes un `Dockerfile` en la raíz del repo.** Railway lo usaría en vez de Nixpacks y
  **no correría `db:setup`** → la base nunca se crea (`SQLITE_CANTOPEN`). El Dockerfile de
  referencia vive en `migration-spike/`.
- Usa **ruta absoluta** en `DATABASE_URL` (ver tabla).
- En **Settings → Networking**, el **puerto del dominio** debe ser **8080** (el `PORT` de Railway).

### Dos despliegues (misma rama, distinta configuración)

| | Producción (datos reales) | Demo (para mostrar a TI) |
|---|---|---|
| Volumen | **Sí**, montado en `/data` | No |
| `DATABASE_URL` | `file:/data/dev.db` | `file:/app/dev.db` |
| `DISABLE_WAL` | `true` | (no aplica) |
| `SEED_DEMO` / `DEMO_MODE` | **no** | `true` / `true` |
| Persistencia | Datos persisten entre deploys | Efímero (se re-siembra cada deploy) |

## Base de datos (actual y futuro)

Hoy usa **SQLite** vía Prisma. El destino corporativo es **SQL Server**, ya validado en
`migration-spike/` (esquema portado + pruebas contra SQL Server real en Docker). Prisma
abstrae el motor, así que el cambio es de adaptador/configuración, no reescritura. Ese
directorio incluye el esquema para SQL Server, `docker-compose` de prueba y un README con
los hallazgos (longitudes de llave, enums, cascadas).

## Estructura

- `src/app/(app)/` — páginas web (dashboard, engranaje, monitor de pesaje, jornadas,
  inspecciones, catálogos).
- `src/app/api/mobile/*` — **contrato con la app Android** (login, catálogos, registros de
  pesaje, peso en vivo). No romper sin coordinar.
- `src/app/api/export/*` — exportaciones CSV para Power BI.
- `prisma/schema.prisma` — modelo de datos. `prisma/seed.ts` + `prisma/seed-demo.ts` — seeds.
- `migration-spike/` — port a SQL Server (referencia para la migración).

## Módulos

Dashboard (indicadores) · Engranaje granja↔cliente (trazabilidad) · Monitor de pesaje en
vivo · Jornadas · Inspecciones · Catálogos. El menú se adapta al rol del usuario
(Verificador, Supervisor, Jefe, Comercial).

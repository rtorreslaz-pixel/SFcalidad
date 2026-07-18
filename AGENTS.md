<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto operativo del proyecto

**Lee `docs/BITACORA.md` primero** — tiene el estado, despliegues, credenciales y decisiones.
Resumen rápido de lo crítico:

- **Marca genérica**: "Sistema de Calidad y Pesaje" (no usar "San Fernando").
- **Rama única**: `main` (ambos despliegues auto-despliegan de ahí).
- **Web + Android en un monorepo** (`android-scale-prototype/`); contrato móvil en `INTEGRATION.md`.
- **Despliegue (Railway) — no romper esto:**
  - Dominio debe apuntar al **puerto 8080** (si no, 502).
  - **No dejar `Dockerfile` en la raíz** (vive en `migration-spike/`); si está en la raíz, Railway salta `db:setup` → `SQLITE_CANTOPEN`.
  - `DATABASE_URL` **absoluta** en producción; `DISABLE_WAL=true` cuando la base está en un volumen.
  - Demo (`sfcalidemo`) es efímero y se re-siembra; producción (`sfcaliprod`) usa volumen.
- **BD**: SQLite hoy vía Prisma; destino corporativo **SQL Server** (validado en `migration-spike/`).
- Cliente Prisma generado en `src/generated/prisma` (`npx prisma generate` si falta).

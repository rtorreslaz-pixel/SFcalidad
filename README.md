# Control de Calidad Avícola

App para digitalizar el registro de inspecciones de calidad de pollo (golpes, rasguños, etc.),
reemplazando el proceso manual en Excel.

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Usuarios de prueba (contraseña `demo1234`):
- `supervisor@avicola.com` (rol Supervisor)
- `verificador1@avicola.com` ... `verificador6@avicola.com` (rol Verificador)

## Despliegue (Railway)

Esta app usa SQLite + archivos subidos en disco, por lo que necesita un host con
filesystem persistente (no Vercel serverless). [Railway](https://railway.app) funciona
sin configuración adicional:

1. En Railway: **New Project → Deploy from GitHub repo**, elige este repositorio y la
   rama `claude/poultry-quality-inspection-chbub6`.
2. Railway detecta Next.js automáticamente (Nixpacks) y corre `npm install` (que ejecuta
   `prisma generate` vía `postinstall`) y luego `npm run build` + `npm start`.
3. Variables de entorno: agrega `DATABASE_URL=file:./dev.db` (opcional, es el valor por
   defecto).
4. Tras el primer deploy, abre la pestaña **Shell** del servicio en Railway y corre:
   ```bash
   npm run db:setup
   ```
   Esto crea las tablas y carga los datos de catálogo + usuarios de prueba.
5. Abre la URL pública que Railway asigna al servicio.

Para producción real con uso continuo, agrega un **Volume** montado en el directorio del
proyecto para que `dev.db` y `public/uploads` persistan entre redeploys.

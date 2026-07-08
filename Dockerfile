# =============================================================================
# Dockerfile de la app web (Next.js) — para desplegar en la infraestructura
# corporativa sin depender de Railway. Build multi-etapa: compila en una imagen
# y corre en una imagen liviana.
#
#   docker build -t sanfernando-calidad .
#   docker run -p 3000:3000 --env-file .env sanfernando-calidad
#
# NOTA sobre la base de datos: la app hoy usa el adaptador de SQLite. Para correr
# sobre SQL Server, TI debe (1) apuntar el adaptador a @prisma/adapter-mssql y
# (2) ejecutar las migraciones con `prisma migrate deploy` como paso previo al
# arranque (no el `db:setup` de SQLite, que activa WAL). El spike de SQL Server
# (carpeta migration-spike/) ya valida que el modelo de datos corre en SQL Server.
# =============================================================================

# ---- Etapa 1: build ----
FROM node:22-slim AS builder
WORKDIR /app

# openssl para Prisma; python3/make/g++ para compilar deps nativas (better-sqlite3)
RUN apt-get update -y && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# El esquema y la config se copian antes de instalar porque el postinstall
# ejecuta `prisma generate` (y necesita el .prisma). better-sqlite3 se compila
# en el mismo npm ci (por eso NO usamos --ignore-scripts).
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Etapa 2: runtime ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copiamos la app ya compilada y sus dependencias
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src/generated ./src/generated

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Arranque directo (sin el db:setup de SQLite). Las migraciones se ejecutan
# como paso de despliegue aparte según el motor destino.
CMD ["npx", "next", "start", "-p", "3000"]

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  // busy_timeout: ante un lock, espera hasta 5s en vez de fallar con SQLITE_BUSY.
  // Mejora la concurrencia de escritura (varios verificadores + balanzas a la vez).
  timeout: 5000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Nota: el modo WAL (persistente en el archivo) se activa en el arranque con
// `scripts/enable-wal.cjs` (dentro de `db:setup`), no en runtime, porque un
// PRAGMA journal_mode dentro de una transacción del driver es no-op.

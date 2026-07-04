// Activa el modo WAL en el archivo SQLite (persistente en el header del archivo):
// permite lecturas y escrituras concurrentes sin que se bloqueen entre sí.
// Se ejecuta en el arranque (npm run db:setup), después de aplicar migraciones.
const Database = require("better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = url.replace(/^file:/, "");

try {
  const db = new Database(dbPath);
  const modo = db.pragma("journal_mode = WAL", { simple: true });
  console.log(`[enable-wal] journal_mode = ${modo} (${dbPath})`);
  db.close();
} catch (err) {
  console.error("[enable-wal] no se pudo activar WAL:", err.message);
  // No abortamos el arranque por esto.
}

// Configura el journal_mode del archivo SQLite en el arranque (npm run db:setup),
// después de aplicar migraciones. El modo queda persistente en el header del archivo.
//
//  - Por defecto: WAL (lecturas y escrituras concurrentes sin bloquearse).
//  - Con DISABLE_WAL=true: DELETE (rollback journal clásico). Úsalo cuando la base
//    vive en un VOLUMEN de Railway: WAL necesita archivos de memoria compartida
//    (-shm/-wal) que los sistemas de archivos de red/volumen no soportan bien, y
//    eso provoca errores "attempt to write a readonly database" (SQLITE_READONLY).
const Database = require("better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = url.replace(/^file:/, "");
const disableWal = process.env.DISABLE_WAL === "true";
const modoDeseado = disableWal ? "DELETE" : "WAL";

try {
  const db = new Database(dbPath);
  const modo = db.pragma(`journal_mode = ${modoDeseado}`, { simple: true });
  console.log(`[journal-mode] journal_mode = ${modo} (${dbPath})${disableWal ? " [volumen: WAL desactivado]" : ""}`);
  db.close();
} catch (err) {
  console.error("[journal-mode] no se pudo configurar journal_mode:", err.message);
  // No abortamos el arranque por esto.
}

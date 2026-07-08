// Config de Prisma SOLO para el spike de SQL Server. Se usa con:
//   npx prisma db push --config migration-spike/prisma.config.ts
// No afecta la config de producción (prisma.config.ts en la raíz).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "schema.sqlserver.prisma",
  datasource: {
    url: process.env["DATABASE_URL_SQLSERVER"] ?? "",
  },
});

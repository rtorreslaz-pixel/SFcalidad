import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tokenValido, APILAMIENTO_TOKEN_PARAM } from "@/lib/apilamiento-token";
import ApilamientoForm from "./form";

// Formulario público (sin sesión) para que los verificadores registren en el local del cliente
// la verificación de apilamiento y ventilación de jabas (IICYB003). El acceso es por enlace con
// token: sin token válido esta página no existe. Es SOLO de escritura -- desde aquí no se
// consultan registros; el reporte se ve con login en /apilamiento-reporte.

export const metadata = {
  title: "Verificación de apilamiento y ventilación",
};

export default async function ApilamientoPublicPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params[APILAMIENTO_TOKEN_PARAM];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!tokenValido(token)) notFound();

  const [clientes, items, localesRegistrados] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.apilamientoItem.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    // Locales ya evaluados, para sugerirlos y que el nombre se escriba igual cada vez.
    prisma.apilamientoRegistro.findMany({ distinct: ["clienteId", "local"], select: { clienteId: true, local: true } }),
  ]);

  const localesPorCliente: Record<string, string[]> = {};
  for (const r of localesRegistrados) {
    (localesPorCliente[r.clienteId] ??= []).push(r.local);
  }
  for (const lista of Object.values(localesPorCliente)) lista.sort();

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 bg-[#0B4EA2] px-4 py-3 text-white shadow-md">
        <div className="text-sm font-bold leading-tight">Sistema de Calidad y Pesaje</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
          Apilamiento y ventilación de jabas
        </div>
      </header>
      <ApilamientoForm clientes={clientes} items={items} token={token!} localesPorCliente={localesPorCliente} />
    </main>
  );
}

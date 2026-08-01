import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { complexLoteFromComplex } from "@/lib/complex-entity";

// Detalle de un muestreo de saca: cada pesada tal como se capturó (jabas, bruto, tara, neto,
// promedio) y el resumen totalizado al final, más la comparación con la preventa del lote.

const CATEGORIA_LABEL: Record<string, string> = { MACHO: "Macho", HEMBRA: "Hembra", MEDIANO: "Mediano" };

function fmtKg(gramos: number | null): string {
  if (gramos == null) return "—";
  return (gramos / 1000).toFixed(3) + " kg";
}

export default async function SacaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const m = await prisma.sacaMuestreo.findUnique({
    where: { id },
    include: {
      plantel: { select: { codigo: true, nombre: true } },
      verificador: { select: { nombre: true } },
      pesadas: { orderBy: { fechaHora: "asc" } },
    },
  });
  if (!m) notFound();
  // Un verificador solo ve sus propios muestreos.
  if (user.role === "VERIFICADOR" && m.verificadorId !== user.id) notFound();

  const totalJabas = m.pesadas.reduce((a, p) => a + p.numJabas, 0);
  const totalAves = m.pesadas.reduce((a, p) => a + p.avesTotal, 0);
  const totalBruto = m.pesadas.reduce((a, p) => a + p.pesoBrutoGramos, 0);
  const totalNeto = m.pesadas.reduce((a, p) => a + p.pesoNetoGramos, 0);
  const promSaca = totalAves > 0 ? totalNeto / totalAves : null;

  // Preventa del mismo lote (mismo complexLote) para la comparación.
  const preventa = m.complexLote
    ? await prisma.registroPesoPreventa.findMany({
        where: { complex: { not: null }, pesoGramos: { not: null } },
        select: { complex: true, pesoGramos: true, edad: true },
      })
    : [];
  const delLote = preventa.filter((r) => complexLoteFromComplex(r.complex) === m.complexLote);
  const promPreventa =
    delLote.length > 0 ? delLote.reduce((a, r) => a + (r.pesoGramos ?? 0), 0) / delLote.length : null;
  const edadesPreventa = delLote.map((r) => r.edad).filter((e): e is number => e != null);
  const edadPreventa =
    edadesPreventa.length > 0 ? edadesPreventa.reduce((a, e) => a + e, 0) / edadesPreventa.length : null;

  const diff = promSaca != null && promPreventa != null ? promSaca - promPreventa : null;
  const diffPct = diff != null && promPreventa ? (diff / promPreventa) * 100 : null;
  const dias = m.edad != null && edadPreventa != null ? m.edad - edadPreventa : null;
  const gananciaDiaria = diff != null && dias != null && dias > 0 ? diff / dias : null;

  return (
    <div>
      <Link href="/saca" className="text-sm font-semibold text-blue-700 hover:underline">
        ← Volver a pesaje de saca
      </Link>

      <h1 className="mt-2 text-xl font-bold text-slate-900">
        {m.plantel.codigo} · {m.campania ?? "—"} · G{m.galpon} · {CATEGORIA_LABEL[m.categoria] ?? m.categoria}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Saca del {m.fecha.toLocaleDateString("es-PE")} · {m.edad != null ? `${m.edad} días · ` : ""}
        {m.avesPorJaba} aves/jaba · tara {(m.taraGramosPorJaba / 1000).toFixed(1)} kg/jaba
        {m.tipoJaba ? ` (${m.tipoJaba})` : ""} · {m.verificador.nombre}
      </p>

      {/* Comparación con preventa */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Promedio saca</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{fmtKg(promSaca)}</div>
          <div className="text-xs text-slate-400">{m.edad != null ? `${m.edad} días` : "edad n/d"}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Promedio preventa</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{fmtKg(promPreventa)}</div>
          <div className="text-xs text-slate-400">
            {delLote.length > 0
              ? `${delLote.length} aves${edadPreventa != null ? ` · ${edadPreventa.toFixed(0)} días` : ""}`
              : "sin preventa del lote"}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diferencia</div>
          <div
            className={`mt-1 text-2xl font-bold ${
              diff == null ? "text-slate-400" : diff >= 0 ? "text-green-700" : "text-amber-700"
            }`}
          >
            {diff == null ? "—" : `${diff >= 0 ? "+" : ""}${(diff / 1000).toFixed(3)} kg`}
          </div>
          <div className="text-xs text-slate-400">
            {diffPct != null ? `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%` : ""}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ganancia diaria</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {gananciaDiaria != null ? `${Math.round(gananciaDiaria)} g` : "—"}
          </div>
          <div className="text-xs text-slate-400">{dias != null ? `en ${dias.toFixed(0)} días` : ""}</div>
        </div>
      </div>

      {/* Lista de pesadas + resumen totalizado al final */}
      <h2 className="mb-2 text-sm font-bold text-slate-900">Pesadas del muestreo</h2>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Hora</th>
              <th className="px-3 py-2.5 font-medium">Jabas</th>
              <th className="px-3 py-2.5 font-medium">Aves</th>
              <th className="px-3 py-2.5 font-medium">Bruto</th>
              <th className="px-3 py-2.5 font-medium">Tara</th>
              <th className="px-3 py-2.5 font-medium">Neto</th>
              <th className="px-3 py-2.5 font-medium">Prom. por ave</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {m.pesadas.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                  {p.fechaHora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-2">{p.numJabas}</td>
                <td className="px-3 py-2">{p.avesTotal}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtKg(p.pesoBrutoGramos)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                  −{fmtKg(m.taraGramosPorJaba * p.numJabas)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-semibold">{fmtKg(p.pesoNetoGramos)}</td>
                <td className="px-3 py-2 whitespace-nowrap font-semibold text-blue-700">
                  {Math.round(p.promedioGramos)} g
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
            <tr>
              <td className="px-3 py-2.5" colSpan={2}>
                Total ({m.pesadas.length} pesadas)
              </td>
              <td className="px-3 py-2.5">{totalJabas}</td>
              <td className="px-3 py-2.5">{totalAves}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{fmtKg(totalBruto)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">−{fmtKg(totalBruto - totalNeto)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{fmtKg(totalNeto)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-blue-700">
                {promSaca != null ? Math.round(promSaca) + " g" : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

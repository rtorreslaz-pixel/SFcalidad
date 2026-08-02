import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { complexLoteFromComplex } from "@/lib/complex-entity";

// Módulo de saca: reporta los muestreos de jabas que hace el equipo de saca (~40+ días)
// y los compara contra el muestreo de preventa (~35 días) del MISMO lote. El cruce se hace
// por complexLote (Plantel-Campaña-Galpón-Categoría), que es el complex de preventa sin el
// corral -- la saca se muestrea a nivel galpón y preventa baja hasta corral.

const CATEGORIA_LABEL: Record<string, string> = { MACHO: "Macho", HEMBRA: "Hembra", MEDIANO: "Mediano" };

function fmtKg(gramos: number | null): string {
  if (gramos == null) return "—";
  return (gramos / 1000).toFixed(3) + " kg";
}

function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function SacaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const muestreos = await prisma.sacaMuestreo.findMany({
    where: user.role === "VERIFICADOR" ? { verificadorId: user.id } : {},
    orderBy: { fecha: "desc" },
    take: 200,
    include: {
      plantel: { select: { codigo: true, nombre: true } },
      verificador: { select: { nombre: true } },
      pesadas: { orderBy: { fechaHora: "asc" } },
    },
  });

  // Preventa de los mismos lotes, para comparar estimado (35 d) vs real de saca (40+ d).
  const complexLotes = [...new Set(muestreos.map((m) => m.complexLote).filter((c): c is string => !!c))];
  const preventa = complexLotes.length
    ? await prisma.registroPesoPreventa.findMany({
        where: { complex: { not: null }, pesoGramos: { not: null } },
        select: { complex: true, pesoGramos: true, edad: true },
      })
    : [];

  // La preventa se agrega por DOS claves: el complex exacto (con corral/lado) y el del lote
  // (sin corral). Al comparar se usa el exacto y, si la saca se tomó de otro lado, el del lote.
  type Agregado = { suma: number; n: number; sumaEdad: number; nEdad: number };
  const acumular = (mapa: Map<string, Agregado>, clave: string | null, peso: number, edad: number | null) => {
    if (!clave) return;
    const e = mapa.get(clave) ?? { suma: 0, n: 0, sumaEdad: 0, nEdad: 0 };
    e.suma += peso;
    e.n += 1;
    if (edad != null) {
      e.sumaEdad += edad;
      e.nEdad += 1;
    }
    mapa.set(clave, e);
  };
  const preventaPorComplex = new Map<string, Agregado>();
  const preventaPorLote = new Map<string, Agregado>();
  for (const r of preventa) {
    if (r.pesoGramos == null) continue;
    acumular(preventaPorComplex, r.complex, r.pesoGramos, r.edad);
    acumular(preventaPorLote, complexLoteFromComplex(r.complex), r.pesoGramos, r.edad);
  }

  const filas = muestreos.map((m) => {
    const totalJabas = m.pesadas.reduce((a, p) => a + p.numJabas, 0);
    const totalAves = m.pesadas.reduce((a, p) => a + p.avesTotal, 0);
    const totalNeto = m.pesadas.reduce((a, p) => a + p.pesoNetoGramos, 0);
    const promSaca = totalAves > 0 ? totalNeto / totalAves : null;

    // Preferencia: mismo lado (complex exacto); si no hay, el galpón completo.
    const pvExacto = m.complex ? preventaPorComplex.get(m.complex) : undefined;
    const pv = pvExacto ?? (m.complexLote ? preventaPorLote.get(m.complexLote) : undefined);
    const cruce = pvExacto ? "mismo lado" : pv ? "galpón" : null;
    const promPreventa = pv && pv.n > 0 ? pv.suma / pv.n : null;
    const edadPreventa = pv && pv.nEdad > 0 ? pv.sumaEdad / pv.nEdad : null;

    const diff = promSaca != null && promPreventa != null ? promSaca - promPreventa : null;
    const diffPct = diff != null && promPreventa ? (diff / promPreventa) * 100 : null;
    // Ganancia diaria entre las dos edades (g/día): cuánto subió el ave entre preventa y saca.
    const dias = m.edad != null && edadPreventa != null ? m.edad - edadPreventa : null;
    const gananciaDiaria = diff != null && dias != null && dias > 0 ? diff / dias : null;

    return { m, totalJabas, totalAves, totalNeto, promSaca, promPreventa, edadPreventa, diff, diffPct, gananciaDiaria, cruce };
  });

  // Totales del módulo
  const conComparacion = filas.filter((f) => f.diff != null);
  const promDiffPct =
    conComparacion.length > 0
      ? conComparacion.reduce((a, f) => a + (f.diffPct ?? 0), 0) / conComparacion.length
      : null;
  const totalAvesTodas = filas.reduce((a, f) => a + f.totalAves, 0);
  const totalJabasTodas = filas.reduce((a, f) => a + f.totalJabas, 0);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Pesaje de saca</h1>
        <a
          href="/api/saca/export"
          download
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Descargar CSV
        </a>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Muestreos de jabas que toma el equipo de saca antes de la saca diaria (~40+ días), comparados contra
        el muestreo de preventa (~35 días) del mismo lote.
      </p>

      {/* Totalizadores */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Muestreos</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{filas.length}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jabas pesadas</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalJabasTodas}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aves muestreadas</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalAvesTodas}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Δ vs preventa</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {promDiffPct != null ? (promDiffPct >= 0 ? "+" : "") + promDiffPct.toFixed(1) + "%" : "—"}
          </div>
          <div className="text-xs text-slate-400">{conComparacion.length} lote(s) con preventa</div>
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Todavía no hay muestreos de saca registrados. Se crean desde la app móvil (módulo Pesaje de saca).
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
                <th className="px-3 py-2.5 font-medium">Plantel</th>
                <th className="px-3 py-2.5 font-medium">Campaña</th>
                <th className="px-3 py-2.5 font-medium">Galpón</th>
                <th className="px-3 py-2.5 font-medium">Lado</th>
                <th className="px-3 py-2.5 font-medium">Categoría</th>
                <th className="px-3 py-2.5 font-medium">Edad</th>
                <th className="px-3 py-2.5 font-medium">Pesadas</th>
                <th className="px-3 py-2.5 font-medium">Jabas</th>
                <th className="px-3 py-2.5 font-medium">Aves</th>
                <th className="px-3 py-2.5 font-medium">Prom. saca</th>
                <th className="px-3 py-2.5 font-medium">Prom. preventa</th>
                <th className="px-3 py-2.5 font-medium">Δ</th>
                <th className="px-3 py-2.5 font-medium">g/día</th>
                <th className="px-3 py-2.5 font-medium">Verificador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/saca/${f.m.id}`} className="font-semibold text-blue-700 hover:underline">
                      {fmtFecha(f.m.fecha)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{f.m.plantel.codigo}</td>
                  <td className="px-3 py-2">{f.m.campania ?? "—"}</td>
                  <td className="px-3 py-2">{f.m.galpon}</td>
                  <td className="px-3 py-2">{f.m.corral ?? "—"}</td>
                  <td className="px-3 py-2">{CATEGORIA_LABEL[f.m.categoria] ?? f.m.categoria}</td>
                  <td className="px-3 py-2">{f.m.edad != null ? `${f.m.edad} d` : "—"}</td>
                  <td className="px-3 py-2">{f.m.pesadas.length}</td>
                  <td className="px-3 py-2">{f.totalJabas}</td>
                  <td className="px-3 py-2">{f.totalAves}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap">{fmtKg(f.promSaca)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                    {fmtKg(f.promPreventa)}
                    {f.edadPreventa != null && (
                      <span className="ml-1 text-xs text-slate-400">({f.edadPreventa.toFixed(0)} d)</span>
                    )}
                    {f.cruce === "galpón" && (
                      <span className="ml-1 text-xs text-amber-700" title="No hay preventa del mismo lado: se compara contra todo el galpón">
                        (galpón)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {f.diff == null ? (
                      <span className="text-slate-400">sin preventa</span>
                    ) : (
                      <span className={f.diff >= 0 ? "font-semibold text-green-700" : "font-semibold text-amber-700"}>
                        {(f.diff >= 0 ? "+" : "") + (f.diff / 1000).toFixed(3)} kg
                        <span className="ml-1 text-xs font-normal">
                          ({(f.diffPct ?? 0) >= 0 ? "+" : ""}
                          {(f.diffPct ?? 0).toFixed(1)}%)
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {f.gananciaDiaria != null ? Math.round(f.gananciaDiaria) + " g" : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">{f.m.verificador.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

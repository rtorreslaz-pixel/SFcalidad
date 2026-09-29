import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  construirDespachos,
  leerFiltrosGallina,
  queryDeFiltrosGallina,
  totalesDespacho,
} from "@/lib/gallina";

// Módulo GALLINA: el pesaje de gallina de descarte en el despacho al cliente. A diferencia
// de preventa y saca, que muestrean un lote en granja, aquí la unidad es el camión: una
// guía, una placa y las tandas de jabas que se le pesaron (vacías y con las gallinas).

function fmtKg(gramos: number): string {
  return (gramos / 1000).toFixed(3);
}

function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function GallinaPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; cliente?: string; material?: string; guia?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const filtros = leerFiltrosGallina(await searchParams);
  const qs = queryDeFiltrosGallina(filtros);

  const [despachos, clientes, materiales] = await Promise.all([
    construirDespachos(user, filtros),
    prisma.cliente.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.materialGallina.findMany({
      select: { id: true, codigo: true, descripcion: true },
      orderBy: { codigo: "asc" },
    }),
  ]);

  const totales = despachos.map(totalesDespacho);
  const totJabas = totales.reduce((a, t) => a + t.jabas, 0);
  const totUnidades = totales.reduce((a, t) => a + t.unidades, 0);
  const totNeto = totales.reduce((a, t) => a + t.neto, 0);
  const promGeneral = totUnidades > 0 ? totNeto / totUnidades : null;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Gallina</h1>
      <p className="mb-4 text-sm text-slate-500">
        Pesaje de gallina de descarte en el despacho al cliente. Cada tanda de jabas se pesa vacía
        y con las gallinas dentro; el neto es la resta.
      </p>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <label htmlFor="desde" className="block text-xs font-medium text-slate-600">Desde</label>
          <input id="desde" type="date" name="desde" defaultValue={filtros.desde ?? ""} className="input mt-1" />
        </div>
        <div>
          <label htmlFor="hasta" className="block text-xs font-medium text-slate-600">Hasta</label>
          <input id="hasta" type="date" name="hasta" defaultValue={filtros.hasta ?? ""} className="input mt-1" />
        </div>
        <div>
          <label htmlFor="cliente" className="block text-xs font-medium text-slate-600">Cliente</label>
          <select id="cliente" name="cliente" defaultValue={filtros.cliente ?? ""} className="input mt-1">
            <option value="">Todos</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="material" className="block text-xs font-medium text-slate-600">Material</label>
          <select id="material" name="material" defaultValue={filtros.material ?? ""} className="input mt-1">
            <option value="">Todos</option>
            {materiales.map((m) => <option key={m.id} value={m.id}>{m.codigo} — {m.descripcion}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="guia" className="block text-xs font-medium text-slate-600">Guía</label>
          <input id="guia" name="guia" defaultValue={filtros.guia ?? ""} placeholder="N° de guía" className="input mt-1" />
        </div>
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          Filtrar
        </button>
        <a href={`/api/gallina/export${qs}${qs ? "&" : "?"}formato=xlsx`}
           className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Excel
        </a>
        <a href={`/api/gallina/export${qs}`}
           className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          CSV
        </a>
      </form>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Despachos</div>
          <div className="text-2xl font-bold text-slate-900">{despachos.length}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Jabas</div>
          <div className="text-2xl font-bold text-slate-900">{totJabas}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Unidades</div>
          <div className="text-2xl font-bold text-slate-900">{totUnidades}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Promedio por ave</div>
          <div className="text-2xl font-bold text-slate-900">
            {promGeneral == null ? "—" : Math.round(promGeneral) + " g"}
          </div>
        </div>
      </div>

      {despachos.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No hay despachos registrados con esos filtros.
        </p>
      ) : (
        <div className="space-y-4">
          {despachos.map((d, i) => {
            const t = totales[i];
            return (
              <div key={d.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-3">
                  <span className="font-semibold text-slate-900">{d.cliente.nombre}</span>
                  <span className="text-sm text-slate-500">{fmtFecha(d.fecha)}</span>
                  <span className="text-sm text-slate-500">
                    {d.material.codigo} — {d.material.descripcion}
                  </span>
                  <span className="ml-auto text-sm text-slate-500">
                    Guía <b className="text-slate-700">{d.guiaReferencia}</b> · Placa{" "}
                    <b className="text-slate-700">{d.placa}</b>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Pesada</th>
                        <th className="px-4 py-2 font-medium">Jabas</th>
                        <th className="px-4 py-2 font-medium">Unidades</th>
                        <th className="px-4 py-2 font-medium">Destare</th>
                        <th className="px-4 py-2 font-medium">Con ave</th>
                        <th className="px-4 py-2 font-medium">Neto</th>
                        <th className="px-4 py-2 font-medium">Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {d.pesadas.map((p, j) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-500">{j + 1}</td>
                          <td className="px-4 py-2">{p.jabas}</td>
                          <td className="px-4 py-2">{p.unidades}</td>
                          <td className="px-4 py-2">{fmtKg(p.pesoDestareGramos)} kg</td>
                          <td className="px-4 py-2">{fmtKg(p.pesoConAveGramos)} kg</td>
                          <td className="px-4 py-2 font-medium">{fmtKg(p.pesoNetoGramos)} kg</td>
                          <td className="px-4 py-2 font-medium">{Math.round(p.promedioGramos)} g</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                        <td className="px-4 py-2 text-slate-500">Total</td>
                        <td className="px-4 py-2">{t.jabas}</td>
                        <td className="px-4 py-2">{t.unidades}</td>
                        <td className="px-4 py-2">{fmtKg(t.destare)} kg</td>
                        <td className="px-4 py-2">{fmtKg(t.conAve)} kg</td>
                        <td className="px-4 py-2">{fmtKg(t.neto)} kg</td>
                        <td className="px-4 py-2">{t.promedio == null ? "—" : Math.round(t.promedio) + " g"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 text-xs text-slate-500">
                  Densidad {d.densidad} aves/jaba · {d.verificador.nombre}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

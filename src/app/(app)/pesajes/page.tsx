import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { anularPreventaAction, restaurarPreventaAction } from "@/lib/anulacion-actions";

// Detalle ave por ave de un muestreo de preventa/calidad. Es la pantalla desde la que se
// anula un pesaje mal tomado: el resumen por galpón llega hasta el corral, y aquí se baja
// hasta cada ave para poder marcar la que salió mal.
//
// Un registro anulado NO se borra: se queda a la vista en rojo, con quién y cuándo, y sale
// de promedios, CV, uniformidad y conteos.

const CATEGORIA_LABEL: Record<string, string> = { MACHO: "Macho", HEMBRA: "Hembra", MEDIANO: "Mediano" };

function fmtHora(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function gradoLabel(v: number | null): string {
  if (v == null) return "—";
  return ["Sin lesión", "Leve", "Grave"][v] ?? String(v);
}

export default async function PesajesPage({
  searchParams,
}: {
  searchParams: Promise<{ complex?: string; dia?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { complex, dia } = await searchParams;
  if (!complex || !dia) redirect("/resumen-galpon");

  // El día viene como yyyy-MM-dd en hora de Perú; la captura se guarda en UTC.
  const desde = new Date(`${dia}T00:00:00.000-05:00`);
  const hasta = new Date(`${dia}T23:59:59.999-05:00`);

  const where: Record<string, unknown> = { complex, fechaHora: { gte: desde, lte: hasta } };
  if (user.role === "VERIFICADOR") where.verificadorId = user.id;

  const registros = await prisma.registroPesoPreventa.findMany({
    where,
    orderBy: { numeroAve: "asc" },
    include: {
      plantel: { select: { codigo: true, nombre: true } },
      verificador: { select: { nombre: true } },
      anuladoPor: { select: { nombre: true } },
    },
  });

  const vigentes = registros.filter((r) => r.anuladoEn == null);
  const conPeso = vigentes.filter((r) => r.pesoGramos != null && r.pesoGramos > 0);
  const aves = vigentes.reduce((a, r) => a + (r.nAvesPorPesada && r.nAvesPorPesada > 1 ? r.nAvesPorPesada : 1), 0);
  const sumaPeso = conPeso.reduce(
    (a, r) => a + (r.pesoGramos ?? 0) * (r.nAvesPorPesada && r.nAvesPorPesada > 1 ? r.nAvesPorPesada : 1),
    0
  );
  const avesConPeso = conPeso.reduce((a, r) => a + (r.nAvesPorPesada && r.nAvesPorPesada > 1 ? r.nAvesPorPesada : 1), 0);
  const promedio = avesConPeso > 0 ? sumaPeso / avesConPeso : null;
  const ruta = `/pesajes?complex=${encodeURIComponent(complex)}&dia=${dia}`;

  const cabecera = registros[0];

  return (
    <div>
      <Link href="/resumen-galpon" className="text-sm font-semibold text-brand hover:underline">
        ← Volver al resumen por galpón
      </Link>
      <h1 className="mt-2 mb-1 text-xl font-bold text-slate-900">
        {cabecera ? `${cabecera.plantel?.codigo ?? ""} · G${cabecera.galpon} · ${cabecera.corral}` : complex}
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {dia}
        {cabecera && ` · ${CATEGORIA_LABEL[cabecera.categoria] ?? cabecera.categoria}`}
        {cabecera?.verificador && ` · ${cabecera.verificador.nombre}`}
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Aves vigentes</div>
          <div className="text-2xl font-bold text-slate-900">{aves}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Promedio</div>
          <div className="text-2xl font-bold text-slate-900">
            {promedio == null ? "—" : Math.round(promedio) + " g"}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Registros</div>
          <div className="text-2xl font-bold text-slate-900">{registros.length}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-medium text-slate-500">Anulados</div>
          <div className="text-2xl font-bold text-red-600">{registros.length - vigentes.length}</div>
        </div>
      </div>

      {registros.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No hay pesajes para ese corral y día.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">N° ave</th>
                <th className="px-3 py-2.5 font-medium">Hora</th>
                <th className="px-3 py-2.5 font-medium">Peso</th>
                <th className="px-3 py-2.5 font-medium">Aves/pesada</th>
                <th className="px-3 py-2.5 font-medium">Pododermatitis</th>
                <th className="px-3 py-2.5 font-medium">Rasguños</th>
                <th className="px-3 py-2.5 font-medium">Pigm.</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {registros.map((r) => {
                const anulado = r.anuladoEn != null;
                return (
                  <tr
                    key={r.id}
                    className={anulado ? "bg-red-50 text-red-700 line-through" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 font-semibold">{r.numeroAve}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{fmtHora(r.fechaHora)}</td>
                    <td className="px-3 py-2 font-medium">
                      {r.pesoGramos ? `${Math.round(r.pesoGramos)} g` : "—"}
                    </td>
                    <td className="px-3 py-2">{r.nAvesPorPesada ?? 1}</td>
                    <td className="px-3 py-2">{gradoLabel(r.gradoPododermatitis)}</td>
                    <td className="px-3 py-2">{gradoLabel(r.gradoRasguno)}</td>
                    <td className="px-3 py-2">{r.pigmentacion ?? "—"}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap no-underline">
                      {anulado ? (
                        <form action={restaurarPreventaAction.bind(null, r.id, ruta)}>
                          <span className="mr-2 text-xs text-red-600">
                            Anulado{r.anuladoPor ? ` por ${r.anuladoPor.nombre}` : ""}
                          </span>
                          <button type="submit" className="text-xs font-semibold text-slate-600 hover:underline">
                            Restaurar
                          </button>
                        </form>
                      ) : (
                        <form action={anularPreventaAction.bind(null, r.id, ruta)}>
                          <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                            Anular
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

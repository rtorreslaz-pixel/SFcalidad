import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularPorcentajeSeleccion } from "@/lib/calc";

export default async function InspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");

  const { id } = await params;

  const insp = await prisma.inspeccion.findUnique({
    where: { id },
    include: {
      cliente: true,
      plantel: true,
      verificador: { select: { nombre: true } },
      defectos: { include: { tipoDefecto: true }, orderBy: { tipoDefecto: { orden: "asc" } } },
      evaluacionesLesion: true,
      fotos: true,
    },
  });

  if (!insp) notFound();

  if (user.role === "VERIFICADOR" && insp.verificadorId !== user.id) {
    redirect("/inspecciones/nueva");
  }

  const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
  const totalKg = insp.defectos.reduce((acc, d) => acc + d.kg, 0);
  const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);
  const excede = porcentaje > insp.metaPorcentaje;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/inspecciones" className="text-sm text-emerald-700 hover:underline">
          ← Volver al listado
        </Link>
        <span
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            excede ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          % Selección: {porcentaje.toFixed(3)}% (meta {insp.metaPorcentaje}%)
        </span>
      </div>

      <section className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h1 className="mb-4 text-xl font-bold text-slate-900">
          Inspección · {insp.fecha.toLocaleDateString("es-PE")}
        </h1>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <Info label="Cliente" value={insp.cliente.nombre} />
          <Info label="Plantel" value={insp.plantel?.codigo ?? "-"} />
          <Info label="Galpón" value={insp.galpon ?? "-"} />
          <Info label="Sexo" value={insp.sexo ?? "-"} />
          <Info label="Cantidad de aves" value={insp.cantidad.toString()} />
          <Info label="Jabas" value={insp.jabas?.toString() ?? "-"} />
          <Info label="Campaña" value={insp.campania ?? "-"} />
          <Info label="Nro. Guía" value={insp.nroGuia ?? "-"} />
          <Info label="Verificador" value={insp.verificador.nombre} />
          <Info label="Total unidades seleccionadas" value={totalUnidades.toString()} />
          <Info label="Total kg seleccionados" value={totalKg.toFixed(2)} />
        </div>
        {insp.observaciones && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Observaciones</p>
            <p className="mt-1 text-sm text-slate-700">{insp.observaciones}</p>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Defectos registrados</h2>
        {insp.defectos.length === 0 ? (
          <p className="text-sm text-slate-400">No se registraron defectos en esta inspección.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Defecto</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 font-medium">Unidades</th>
                  <th className="px-3 py-2 font-medium">Kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {insp.defectos.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2">{d.tipoDefecto.nombre}</td>
                    <td className="px-3 py-2 text-slate-500">{d.tipoDefecto.categoria}</td>
                    <td className="px-3 py-2">{d.unidades}</td>
                    <td className="px-3 py-2">{d.kg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {insp.evaluacionesLesion.length > 0 && (
        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="mb-3 font-semibold text-slate-900">Almohadillas y Rasguños</h2>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 font-medium">Sexo</th>
                  <th className="px-3 py-2 font-medium">Muestra</th>
                  <th className="px-3 py-2 font-medium">Sin lesión</th>
                  <th className="px-3 py-2 font-medium">Leve</th>
                  <th className="px-3 py-2 font-medium">Grave / Severo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {insp.evaluacionesLesion.map((ev) => (
                  <tr key={ev.id}>
                    <td className="px-3 py-2">
                      {ev.categoria === "ALMOHADILLAS" ? "Almohadillas" : "Rasguños"}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {ev.sexo === "MACHO" ? "Macho" : "Hembra"}
                    </td>
                    <td className="px-3 py-2">{ev.muestra}</td>
                    <td className="px-3 py-2">{ev.sinLesion}</td>
                    <td className="px-3 py-2">{ev.leve}</td>
                    <td className="px-3 py-2">{ev.grave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Fotos referenciales</h2>
        {insp.fotos.length === 0 ? (
          <p className="text-sm text-slate-400">No se adjuntaron fotos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {insp.fotos.map((foto) => (
              <div key={foto.id}>
                <a href={foto.path} target="_blank" rel="noreferrer" className="block">
                  <Image
                    src={foto.path}
                    alt="Foto de inspección"
                    width={200}
                    height={200}
                    className="aspect-square w-full rounded-md object-cover ring-1 ring-slate-200"
                    unoptimized
                  />
                </a>
                {foto.latitud != null && foto.longitud != null && (
                  <a
                    href={`https://www.google.com/maps?q=${foto.latitud},${foto.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-center text-xs text-emerald-700 hover:underline"
                  >
                    📍 Ver ubicación
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-slate-800">{value}</p>
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RESULTADO_LABEL } from "@/lib/apilamiento";

// Detalle de una verificación: cabecera, los 8 ítems con su resultado y observación, y la
// evidencia (fotos y videos). El verificador solo levanta información: no hay acciones
// correctivas en el registro.

const RESULTADO_BADGE: Record<string, string> = {
  C: "bg-green-100 text-green-700",
  NC: "bg-red-100 text-red-700",
  NA: "bg-slate-100 text-slate-600",
  VN: "bg-blue-100 text-blue-700",
};

const BLOQUE_LABEL: Record<string, string> = {
  DESCARGA: "Descarga",
  APILAMIENTO: "Apilamiento",
  VENTILACION: "Ventilación",
};

export default async function ApilamientoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const r = await prisma.apilamientoRegistro.findUnique({
    where: { id },
    include: {
      cliente: { select: { nombre: true } },
      detalles: { include: { item: true }, orderBy: { item: { orden: "asc" } } },
      medias: true,
    },
  });
  if (!r) notFound();

  // Evidencia general del local: la de la ventilación, que no pertenece a un ítem.
  const mediasVentilacion = r.medias.filter((m) => m.itemCodigo === null);

  return (
    <div>
      <Link href="/apilamiento-reporte" className="text-sm font-semibold text-blue-700 hover:underline">
        ← Volver al reporte
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">{r.codigoRegistro}</h1>
        <span
          className={`rounded px-2 py-0.5 text-sm font-bold ${
            r.semaforo === "VERDE"
              ? "bg-green-100 text-green-700"
              : r.semaforo === "AMBAR"
                ? "bg-amber-100 text-amber-700"
                : r.semaforo === "ROJO"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
          }`}
        >
          {r.porcentajeCumplimiento != null ? `${r.porcentajeCumplimiento.toFixed(1)}%` : "sin evaluar"}
        </span>
        {r.hallazgoCritico && (
          <span className="rounded bg-red-600 px-2 py-0.5 text-sm font-bold text-white">Hallazgo crítico</span>
        )}
      </div>

      <p className="mb-6 text-sm text-slate-500">
        {r.cliente.nombre} · <b>{r.local}</b> · {r.fechaEvaluacion.toLocaleDateString("es-PE")} · {r.verificadorNombre}
      </p>

      {/* Cabecera */}
      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 sm:grid-cols-4">
        <Dato label="Cliente" valor={r.cliente.nombre} />
        <Dato label="Local" valor={r.local} />
        <Dato label="Fecha" valor={r.fechaEvaluacion.toLocaleDateString("es-PE")} />
        <Dato
          label="Ventilación"
          valor={r.tipoVentilacion === "MECANICA" ? `Mecánica (${r.cantidadVentiladores ?? 0} vent.)` : "Natural"}
        />
        <Dato label="Conformes / No conformes" valor={`${r.itemsConformes} / ${r.itemsNoConformes}`} />
      </div>

      {/* Evidencia de la ventilación del local (medias sin ítem asociado) */}
      {mediasVentilacion.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-bold text-slate-900">Evidencia de la ventilación</h2>
          <div className="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {mediasVentilacion.map((m) =>
              m.tipo === "VIDEO" ? (
                <video key={m.id} src={m.path} controls className="h-40 rounded-lg bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={m.id} src={m.path} alt="Evidencia de la ventilación" className="h-40 rounded-lg object-cover" />
              )
            )}
          </div>
        </>
      )}

      {/* Checklist */}
      <h2 className="mb-2 text-sm font-bold text-slate-900">Checklist</h2>
      <div className="mb-6 space-y-2">
        {r.detalles.map((d) => {
          const medias = r.medias.filter((m) => m.itemCodigo === d.itemCodigo);
          return (
            <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-400">
                    {d.itemCodigo} · {BLOQUE_LABEL[d.item.bloque] ?? d.item.bloque}
                    {d.item.referenciaInstructivo ? ` · IICYB003 ${d.item.referenciaInstructivo}` : ""}
                  </div>
                  <p className="text-sm text-slate-800">{d.item.descripcion}</p>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-bold ${RESULTADO_BADGE[d.resultado]}`}>
                  {RESULTADO_LABEL[d.resultado]}
                </span>
              </div>

              {d.observacion && (
                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">
                  <span className="font-semibold">Observación: </span>
                  {d.observacion}
                </p>
              )}

              {medias.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {medias.map((m) =>
                    m.tipo === "VIDEO" ? (
                      <video key={m.id} src={m.path} controls className="h-40 rounded-lg bg-black" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={m.id} src={m.path} alt="Evidencia" className="h-40 rounded-lg object-cover" />
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {r.observacionesGenerales && (
        <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="font-semibold">Observaciones generales: </span>
          {r.observacionesGenerales}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-semibold text-slate-900">{valor}</div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SaldoEditor from "./saldo-editor";
import DeleteJornadaButton from "./delete-jornada-button";
import { createEvaluacionAction } from "./evaluacion/nueva/nueva-evaluacion-actions";

export default async function JornadaDetallePage({
  params,
}: {
  params: Promise<{ jornadaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");
  if (user.role === "COMERCIAL") redirect("/dashboard/preventa");

  const { jornadaId } = await params;

  const jornada = await prisma.jornada.findUnique({
    where: { id: jornadaId },
    include: {
      cliente: true,
      verificador: { select: { nombre: true } },
      saldos: { orderBy: { sexo: "asc" } },
      inspecciones: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sexo: true,
          estado: true,
          pasoActual: true,
          galpon: true,
          corral: true,
          plantel: { select: { codigo: true } },
        },
      },
    },
  });

  if (!jornada) notFound();

  if (user.role === "VERIFICADOR" && jornada.verificadorId !== user.id) {
    redirect("/jornadas");
  }

  const PASOS_LABELS = ["Cabecera", "Temperaturas", "Almohadillas y Rasguños", "Hematomas", "Pigmentación", "Selección", "Merma"];

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/jornadas" className="text-sm font-semibold text-brand hover:underline">← Jornadas</Link>
          <h1 className="mt-1 text-xl font-extrabold text-slate-900">
            {jornada.fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
          </h1>
          <p className="text-sm text-slate-500">{jornada.cliente.nombre} · {jornada.verificador.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          {jornada.inspecciones.some((i) => i.estado === "COMPLETA") && (
            <>
              <Link
                href={`/jornadas/${jornadaId}/reporte`}
                className="rounded-md border border-brand/40 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5"
              >
                📄 Reporte
              </Link>
              <Link
                href={`/jornadas/${jornadaId}/formatos`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                📋 Formatos
              </Link>
            </>
          )}
          {user.role === "SUPERVISOR" && <DeleteJornadaButton jornadaId={jornadaId} />}
        </div>
      </div>

      {/* Saldo día anterior */}
      <section className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Saldo día anterior</h2>
        <div className="space-y-4">
          {jornada.saldos.map((saldo) => (
            <SaldoEditor key={saldo.id} saldo={saldo} jornadaId={jornadaId} />
          ))}
        </div>
      </section>

      {/* Evaluaciones (camiones) */}
      <section className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Evaluaciones del día</h2>

        {jornada.inspecciones.length === 0 ? (
          <p className="mb-3 text-sm text-slate-400">No hay evaluaciones aún.</p>
        ) : (
          <div className="mb-3 space-y-2">
            {jornada.inspecciones.map((insp) => (
              <Link
                key={insp.id}
                href={`/jornadas/${jornadaId}/evaluacion/${insp.id}`}
                className="flex items-center justify-between rounded-[12px] border border-slate-200 p-3 hover:border-brand/40 hover:bg-brand/5"
              >
                <div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    insp.sexo === "MACHO" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                  }`}>
                    {insp.sexo ?? "Sin sexo"}
                  </span>
                  <span className="ml-2 text-sm text-slate-600">
                    {insp.plantel?.codigo ? `${insp.plantel.codigo}${insp.galpon ? ` · ${insp.galpon}${insp.corral ?? ""}` : ""}` : "Sin plantel"}
                  </span>
                </div>
                <div className="text-right">
                  {insp.estado === "COMPLETA" ? (
                    <span className="text-xs font-semibold text-ok">Completa ✓</span>
                  ) : (
                    <span className="text-xs text-warn">
                      Paso {insp.pasoActual}/7 · {PASOS_LABELS[(insp.pasoActual ?? 1) - 1]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <form action={createEvaluacionAction}>
          <input type="hidden" name="jornadaId" value={jornadaId} />
          <button
            type="submit"
            className="w-full rounded-[14px] border-2 border-dashed border-brand/40 py-3.5 text-sm font-semibold text-brand hover:bg-brand/5"
          >
            + Nueva evaluación
          </button>
        </form>
      </section>
    </div>
  );
}

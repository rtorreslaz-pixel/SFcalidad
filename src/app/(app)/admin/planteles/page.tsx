import { prisma } from "@/lib/db";
import PlantelForm from "./plantel-form";

export default async function PlantelesPage() {
  const [planteles, clientes] = await Promise.all([
    prisma.plantel.findMany({
      orderBy: { codigo: "asc" },
      include: { cliente: true, _count: { select: { inspecciones: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Zona</th>
                <th className="px-3 py-2 font-medium">Subzona</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Zona evaluación</th>
                <th className="px-3 py-2 font-medium">Inspecciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {planteles.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{p.codigo}</td>
                  <td className="px-3 py-2">{p.cliente.nombre}</td>
                  <td className="px-3 py-2">{p.zona ?? "-"}</td>
                  <td className="px-3 py-2">{p.subZona ?? "-"}</td>
                  <td className="px-3 py-2">{p.tipoPlantel ?? "-"}</td>
                  <td className="px-3 py-2">{p.zonaEvaluacion ?? "-"}</td>
                  <td className="px-3 py-2">{p._count.inspecciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PlantelForm clientes={clientes} />
    </div>
  );
}

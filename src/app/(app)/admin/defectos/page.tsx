import { prisma } from "@/lib/db";
import TipoDefectoForm from "./tipo-defecto-form";

export default async function DefectosPage() {
  const tipos = await prisma.tipoDefecto.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { registros: true } } },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Defecto</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium">Principal</th>
                <th className="px-3 py-2 font-medium">Veces registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tipos.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{t.nombre}</td>
                  <td className="px-3 py-2 text-slate-500">{t.categoria}</td>
                  <td className="px-3 py-2">{t.principal ? "Sí" : "—"}</td>
                  <td className="px-3 py-2">{t._count.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <TipoDefectoForm />
    </div>
  );
}

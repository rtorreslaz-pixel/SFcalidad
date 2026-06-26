import { prisma } from "@/lib/db";
import ClienteForm from "./cliente-form";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { inspecciones: true } } },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Inspecciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-3 py-2">{c._count.inspecciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ClienteForm />
    </div>
  );
}

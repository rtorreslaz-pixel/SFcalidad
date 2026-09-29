import { prisma } from "@/lib/db";
import MaterialForm from "./material-form";
import { toggleMaterialGallinaActivoAction } from "../admin-actions";

// Materiales del módulo de gallina. Se desactivan en vez de borrarse: los despachos ya
// registrados siguen mostrando el suyo.
export default async function MaterialesPage() {
  const materiales = await prisma.materialGallina.findMany({
    orderBy: { codigo: "asc" },
    include: { _count: { select: { despachos: true } } },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 font-medium">Despachos</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiales.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{m.codigo}</td>
                  <td className="px-3 py-2 text-slate-600">{m.descripcion}</td>
                  <td className="px-3 py-2 tabular-nums">{m._count.despachos}</td>
                  <td className="px-3 py-2">
                    <span className={m.activo ? "text-emerald-600" : "text-slate-400"}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={toggleMaterialGallinaActivoAction.bind(null, m.id)}>
                      <button type="submit" className="text-xs font-semibold text-brand hover:underline">
                        {m.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {materiales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Aún no hay materiales. Agrega el primero para que aparezca en la app.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <MaterialForm />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/auth";
import UsuarioForm from "./usuario-form";
import ToggleActivoButton from "./toggle-activo-button";
import ApiTokenActions from "./api-token-actions";

export default async function UsuariosPage() {
  const usuarios = await prisma.user.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { inspecciones: true } } },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Correo</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Inspecciones</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acceso móvil</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{u.nombre}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                  <td className="px-3 py-2">{u._count.inspecciones}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        u.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          u.apiToken ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.apiToken ? "Con token" : "Sin token"}
                      </span>
                      <ApiTokenActions userId={u.id} hasToken={!!u.apiToken} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <ToggleActivoButton userId={u.id} activo={u.activo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <UsuarioForm />
    </div>
  );
}

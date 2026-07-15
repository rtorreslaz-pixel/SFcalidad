import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CambiarClaveForm from "./form";

export default async function CambiarClavePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-xl font-extrabold tracking-tight text-brand">Sistema de Calidad y Pesaje</span>
          <div className="mx-auto my-4 h-1 w-16 rounded-full bg-brand" />
          <h1 className="text-lg font-bold text-slate-900">Cambia tu contraseña</h1>
          {user.mustChangePassword ? (
            <p className="mt-2 text-sm text-slate-500">
              Por seguridad, debes establecer una contraseña nueva antes de continuar.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Actualiza tu contraseña de acceso.</p>
          )}
        </div>
        <CambiarClaveForm />
        <form action="/api/logout" method="POST" className="mt-4 text-center">
          <button type="submit" className="text-xs text-slate-400 hover:text-slate-600">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

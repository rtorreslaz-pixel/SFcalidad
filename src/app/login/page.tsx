import { redirect } from "next/navigation";
import { getCurrentUser, homeRouteForRole } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(homeRouteForRole(user.role));
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex flex-col items-center">
            <span className="text-3xl font-extrabold tracking-tight text-brand">San Fernando</span>
          </div>
          <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-brand" />
          <h1 className="text-xl font-bold text-slate-900">
            Control de Calidad Avícola
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Inicia sesión para registrar y revisar inspecciones
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-400">
          ¿No tienes cuenta? Solicítala a tu supervisor de calidad.
        </p>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, ROLE_LABELS } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import NavLinks from "./nav-links";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  // Contraseña inicial / marcada para cambio: bloquea el acceso hasta actualizarla.
  if (user.mustChangePassword) {
    redirect("/cambiar-clave");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-brand print:hidden dark:bg-[#002f86]">
        <div className="mx-auto flex h-[54px] max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex flex-col leading-none">
            <span className="text-base font-extrabold text-white">San Fernando</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/75">
              Calidad · Clientes Lima
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <span className="hidden text-white/80 sm:inline">
              {user.nombre} · {ROLE_LABELS[user.role]}
            </span>
            <ThemeToggle />
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="rounded-md border border-white/30 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4">
          <NavLinks role={user.role} />
        </nav>
      </header>
      {process.env.DEMO_MODE === "true" && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950 print:hidden">
          Ambiente de demostración · datos de prueba (no reales)
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print:max-w-none print:px-0 print:py-0">
        {children}
      </main>
    </div>
  );
}

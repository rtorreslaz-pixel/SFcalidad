import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPERVISOR") redirect("/dashboard");

  const tabs = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/planteles", label: "Planteles" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/defectos", label: "Tipos de defecto" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Catálogos</h1>
      <p className="mb-4 text-sm text-slate-500">
        Administra clientes, planteles, usuarios y tipos de defecto usados en las inspecciones.
      </p>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="whitespace-nowrap rounded-t-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100"
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}

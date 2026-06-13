import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const [clientes, planteles, usuarios, defectos, inspecciones] = await Promise.all([
    prisma.cliente.count(),
    prisma.plantel.count(),
    prisma.user.count(),
    prisma.tipoDefecto.count(),
    prisma.inspeccion.count(),
  ]);

  const items = [
    { href: "/admin/clientes", label: "Clientes", value: clientes },
    { href: "/admin/planteles", label: "Planteles", value: planteles },
    { href: "/admin/usuarios", label: "Usuarios", value: usuarios },
    { href: "/admin/defectos", label: "Tipos de defecto", value: defectos },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-400"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Total de inspecciones registradas: <span className="font-semibold text-slate-700">{inspecciones}</span>
      </p>
    </div>
  );
}

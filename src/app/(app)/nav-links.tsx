"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

export default function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();

  const links =
    role === "SUPERVISOR"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard-bi", label: "Indicadores BI" },
          { href: "/dashboard-bi/engranaje", label: "Engranaje granja-clientes" },
          { href: "/dashboard/preventa", label: "Peso en planta" },
          { href: "/jornadas", label: "Jornadas" },
          { href: "/inspecciones", label: "Inspecciones" },
          { href: "/admin", label: "Catálogos" },
        ]
      : role === "VERIFICADOR"
        ? [
            { href: "/jornadas", label: "Mis jornadas" },
            { href: "/dashboard/preventa", label: "Peso en planta" },
          ]
        : role === "COMERCIAL"
          ? [{ href: "/dashboard/preventa", label: "Peso en planta" }]
          : [
              { href: "/dashboard", label: "Dashboard" },
              { href: "/dashboard-bi", label: "Indicadores BI" },
              { href: "/dashboard-bi/engranaje", label: "Engranaje granja-clientes" },
            ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 text-sm">
      {links.map((link) => {
        const isPrefixMatch = link.href !== "/dashboard" && pathname.startsWith(link.href);
        // Si otro link de la lista es un prefijo más específico que también matchea (p.ej.
        // "/dashboard-bi/engranaje" frente a "/dashboard-bi"), solo el más específico se
        // marca activo -- si no, ambos se resaltarían a la vez en esa subpágina.
        const hayHermanoMasEspecifico = links.some(
          (otro) => otro.href !== link.href && otro.href.startsWith(link.href) && pathname.startsWith(otro.href)
        );
        const active = pathname === link.href || (isPrefixMatch && !hayHermanoMasEspecifico);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${
              active
                ? "bg-white/20 text-white"
                : "text-white/75 hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

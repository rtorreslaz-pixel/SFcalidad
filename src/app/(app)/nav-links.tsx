"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

// showSaca: el módulo de saca está en evaluación y por ahora se muestra solo en el
// despliegue demo (DEMO_MODE=true); el layout lo resuelve en el servidor.
export default function NavLinks({ role, showSaca = false }: { role: Role; showSaca?: boolean }) {
  const pathname = usePathname();

  const baseLinks =
    role === "SUPERVISOR"
      ? [
          { href: "/dashboard-bi", label: "Dashboard" },
          { href: "/dashboard-bi/engranaje", label: "Engranaje granja-clientes" },
          { href: "/dashboard/pesaje", label: "Monitor de pesaje" },
          { href: "/jornadas", label: "Jornadas" },
          { href: "/inspecciones", label: "Inspecciones" },
          { href: "/admin", label: "Catálogos" },
        ]
      : role === "VERIFICADOR"
        ? [
            { href: "/jornadas", label: "Mis jornadas" },
            { href: "/dashboard/pesaje", label: "Monitor de pesaje" },
          ]
        : role === "COMERCIAL"
          ? [
              { href: "/dashboard/pesaje", label: "Monitor de pesaje" },
            ]
          : [
              { href: "/dashboard-bi", label: "Dashboard" },
              { href: "/dashboard-bi/engranaje", label: "Engranaje granja-clientes" },
            ];

  // El módulo de saca se agrega al final de la barra cuando está habilitado.
  const conSaca = showSaca ? [...baseLinks, { href: "/saca", label: "Pesaje de saca" }] : baseLinks;

  // Reporte de apilamiento y ventilación de jabas: lo consultan calidad y jefatura (los
  // verificadores registran desde el enlace público, pero también pueden revisar lo enviado).
  const links =
    role === "COMERCIAL" ? conSaca : [...conSaca, { href: "/apilamiento-reporte", label: "Apilamiento de jabas" }];

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

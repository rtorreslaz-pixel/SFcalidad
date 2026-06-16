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
          { href: "/jornadas", label: "Jornadas" },
          { href: "/inspecciones", label: "Inspecciones" },
          { href: "/admin", label: "Catálogos" },
        ]
      : role === "VERIFICADOR"
        ? [
            { href: "/jornadas", label: "Mis jornadas" },
          ]
        : [{ href: "/dashboard", label: "Dashboard" }];

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 text-sm">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition ${
              active
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

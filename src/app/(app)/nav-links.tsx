"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

export default function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inspecciones", label: "Inspecciones" },
    { href: "/inspecciones/nueva", label: "Nueva inspección" },
    ...(role === "SUPERVISOR"
      ? [{ href: "/admin", label: "Catálogos" }]
      : []),
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 text-sm">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href) && link.href !== "/inspecciones/nueva") ||
          (link.href === "/inspecciones/nueva" && pathname === "/inspecciones/nueva");
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

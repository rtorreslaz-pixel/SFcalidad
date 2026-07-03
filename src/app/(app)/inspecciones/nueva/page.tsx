import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InspectionForm from "./inspection-form";

export default async function NuevaInspeccionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard-bi");
  if (user.role === "COMERCIAL") redirect("/dashboard/pesaje");

  const [clientes, planteles, tiposDefecto, verificadores] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.plantel.findMany({ orderBy: { codigo: "asc" } }),
    prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } }),
    user.role === "SUPERVISOR"
      ? prisma.user.findMany({
          where: { activo: true },
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, role: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Nueva inspección</h1>
      <p className="mb-6 text-sm text-slate-500">
        Registra los hallazgos de calidad y bienestar animal del lote inspeccionado.
      </p>
      <InspectionForm
        clientes={clientes}
        planteles={planteles}
        tiposDefecto={tiposDefecto}
        verificadores={verificadores}
        currentUser={{ id: user.id, nombre: user.nombre, role: user.role }}
      />
    </div>
  );
}

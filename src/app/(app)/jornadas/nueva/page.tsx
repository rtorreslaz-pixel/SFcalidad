import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import JornadaForm from "./jornada-form";

export default async function NuevaJornadaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");

  const clientes = await prisma.cliente.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Nueva jornada</h1>
      <p className="mb-6 text-sm text-slate-500">Registra los datos de la visita al cliente.</p>
      <JornadaForm clientes={clientes} userId={user.id} />
    </div>
  );
}

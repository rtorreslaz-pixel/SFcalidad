import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MonitorPesaje from "./monitor-client";

export default async function MonitorPesajePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Monitor de pesaje en vivo</h1>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        {user.role === "VERIFICADOR"
          ? "El peso en vivo de tu báscula Bluetooth."
          : "Peso en vivo de todas las básculas Bluetooth conectadas en granja."}{" "}
        Se actualiza automáticamente cada 2 segundos.
      </p>

      <MonitorPesaje />
    </div>
  );
}

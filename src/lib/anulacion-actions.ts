"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Anulación de pesajes desde la web (borrado lógico). El registro NO se borra: se marca con
// quién y cuándo, queda a la vista en rojo y sale de promedios, conteos y totales.
//
// A diferencia de la app, aquí sí se puede revertir: el supervisor es quien arregla una
// anulación hecha por error en campo.

type Tipo = "PREVENTA" | "SACA" | "GALLINA";

async function usuarioQuePuedeAnular() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Comercial solo consulta; no toca datos de pesaje.
  if (user.role === "COMERCIAL") redirect("/dashboard/pesaje");
  return user;
}

/** Un verificador solo toca lo suyo; supervisor y jefe, cualquier registro. */
function filtroDeDueño(tipo: Tipo, userId: string, soloPropios: boolean) {
  if (!soloPropios) return {};
  if (tipo === "PREVENTA") return { verificadorId: userId };
  if (tipo === "SACA") return { sacaMuestreo: { verificadorId: userId } };
  return { despacho: { verificadorId: userId } };
}

async function cambiarAnulacion(tipo: Tipo, id: string, anular: boolean, ruta: string) {
  const user = await usuarioQuePuedeAnular();
  const soloPropios = user.role === "VERIFICADOR";
  const where = { id, ...filtroDeDueño(tipo, user.id, soloPropios) };
  const data = anular
    ? { anuladoEn: new Date(), anuladoPorId: user.id }
    : { anuladoEn: null, anuladoPorId: null };

  if (tipo === "PREVENTA") await prisma.registroPesoPreventa.updateMany({ where, data });
  else if (tipo === "SACA") await prisma.sacaPesada.updateMany({ where, data });
  else await prisma.gallinaPesada.updateMany({ where, data });

  revalidatePath(ruta);
}

export async function anularPreventaAction(id: string, ruta: string) {
  await cambiarAnulacion("PREVENTA", id, true, ruta);
}
export async function restaurarPreventaAction(id: string, ruta: string) {
  await cambiarAnulacion("PREVENTA", id, false, ruta);
}
export async function anularSacaAction(id: string, ruta: string) {
  await cambiarAnulacion("SACA", id, true, ruta);
}
export async function restaurarSacaAction(id: string, ruta: string) {
  await cambiarAnulacion("SACA", id, false, ruta);
}
export async function anularGallinaAction(id: string, ruta: string) {
  await cambiarAnulacion("GALLINA", id, true, ruta);
}
export async function restaurarGallinaAction(id: string, ruta: string) {
  await cambiarAnulacion("GALLINA", id, false, ruta);
}

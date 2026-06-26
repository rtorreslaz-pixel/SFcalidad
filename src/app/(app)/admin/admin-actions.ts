"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword, generateApiToken } from "@/lib/auth";

async function requireSupervisor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPERVISOR") redirect("/dashboard");
  return user;
}

export type ActionResult = { error?: string; success?: string } | undefined;

export async function createClienteAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSupervisor();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  try {
    await prisma.cliente.create({ data: { nombre } });
  } catch {
    return { error: "Ya existe un cliente con ese nombre." };
  }

  revalidatePath("/admin/clientes");
  return { success: "Cliente creado." };
}

export async function createPlantelAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSupervisor();
  const codigo = String(formData.get("codigo") ?? "").trim();
  const clienteId = String(formData.get("clienteId") ?? "").trim() || null;
  const zona = String(formData.get("zona") ?? "").trim() || null;
  const subZona = String(formData.get("subZona") ?? "").trim() || null;
  const tipoPlantel = String(formData.get("tipoPlantel") ?? "").trim() || null;
  const zonaEvaluacion = String(formData.get("zonaEvaluacion") ?? "").trim() || null;

  if (!codigo) return { error: "El código es obligatorio." };

  try {
    await prisma.plantel.create({
      data: { codigo, clienteId, zona, subZona, tipoPlantel, zonaEvaluacion },
    });
  } catch {
    return { error: "Ya existe un plantel con ese código." };
  }

  revalidatePath("/admin/planteles");
  return { success: "Plantel creado." };
}

export async function createUsuarioAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSupervisor();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "VERIFICADOR") as "VERIFICADOR" | "SUPERVISOR" | "JEFE" | "COMERCIAL";

  if (!nombre || !email || !password) return { error: "Completa todos los campos." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({ data: { nombre, email, passwordHash, role } });
  } catch {
    return { error: "Ya existe un usuario con ese correo." };
  }

  revalidatePath("/admin/usuarios");
  return { success: "Usuario creado." };
}

export async function toggleUsuarioActivoAction(userId: string) {
  await requireSupervisor();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  await prisma.user.update({ where: { id: userId }, data: { activo: !target.activo } });
  revalidatePath("/admin/usuarios");
}

export async function revokeApiTokenAction(formData: FormData) {
  await requireSupervisor();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await prisma.user.update({ where: { id: userId }, data: { apiToken: null } });
  revalidatePath("/admin/usuarios");
}

export async function rotateApiTokenAction(formData: FormData) {
  await requireSupervisor();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await prisma.user.update({ where: { id: userId }, data: { apiToken: generateApiToken() } });
  revalidatePath("/admin/usuarios");
}

export async function createTipoDefectoAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSupervisor();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || "Otros";

  if (!nombre) return { error: "El nombre es obligatorio." };

  const max = await prisma.tipoDefecto.aggregate({ _max: { orden: true } });

  try {
    await prisma.tipoDefecto.create({
      data: { nombre, categoria, orden: (max._max.orden ?? 0) + 1 },
    });
  } catch {
    return { error: "Ya existe un tipo de defecto con ese nombre." };
  }

  revalidatePath("/admin/defectos");
  return { success: "Tipo de defecto creado." };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveInspectionPhoto } from "@/lib/uploads";

async function getEval(evalId: string) {
  return prisma.inspeccion.findUnique({
    where: { id: evalId },
    include: { jornada: true },
  });
}

export async function autoguardadoAction(
  evalId: string,
  patch: Record<string, unknown>
) {
  const user = await getCurrentUser();
  if (!user) return;

  const insp = await getEval(evalId);
  if (!insp) return;
  if (user.role === "VERIFICADOR" && insp.jornada?.verificadorId !== user.id) return;

  // Handle nested lesion updates
  const { lesionAlmohadillas, lesionRasgunos, defectos: defectosData, hematomaDetalles: hematomaDetallesData, ...directFields } = patch;

  if (Object.keys(directFields).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.inspeccion.update({ where: { id: evalId }, data: directFields as any });
  }

  if (lesionAlmohadillas && insp.sexo) {
    const d = lesionAlmohadillas as { sinLesion: number; leve: number; grave: number };
    await prisma.evaluacionLesion.upsert({
      where: { inspeccionId_categoria_sexo: { inspeccionId: evalId, categoria: "ALMOHADILLAS", sexo: insp.sexo } },
      create: { inspeccionId: evalId, categoria: "ALMOHADILLAS", sexo: insp.sexo, ...d, muestra: d.sinLesion + d.leve + d.grave },
      update: { ...d, muestra: d.sinLesion + d.leve + d.grave },
    });
  }

  if (lesionRasgunos && insp.sexo) {
    const d = lesionRasgunos as { sinLesion: number; leve: number; grave: number };
    await prisma.evaluacionLesion.upsert({
      where: { inspeccionId_categoria_sexo: { inspeccionId: evalId, categoria: "RASGUNOS", sexo: insp.sexo } },
      create: { inspeccionId: evalId, categoria: "RASGUNOS", sexo: insp.sexo, ...d, muestra: d.sinLesion + d.leve + d.grave },
      update: { ...d, muestra: d.sinLesion + d.leve + d.grave },
    });
  }

  if (defectosData && Array.isArray(defectosData)) {
    const defectos = defectosData as { tipoDefectoId: string; unidades: number; kg: number }[];
    for (const d of defectos) {
      await prisma.defectoRegistro.upsert({
        where: { inspeccionId_tipoDefectoId: { inspeccionId: evalId, tipoDefectoId: d.tipoDefectoId } },
        create: { inspeccionId: evalId, tipoDefectoId: d.tipoDefectoId, unidades: d.unidades, kg: d.kg },
        update: { unidades: d.unidades, kg: d.kg },
      });
    }
  }

  if (hematomaDetallesData && Array.isArray(hematomaDetallesData)) {
    const detalles = hematomaDetallesData as { grado: "GRADO1" | "GRADO2" | "GRADO3"; ubicacion: "ALA" | "ESPINAZO" | "PECHUGA" | "PIERNA"; cantidad: number }[];
    for (const d of detalles) {
      await prisma.hematomaDetalle.upsert({
        where: { inspeccionId_grado_ubicacion: { inspeccionId: evalId, grado: d.grado, ubicacion: d.ubicacion } },
        create: { inspeccionId: evalId, grado: d.grado, ubicacion: d.ubicacion, cantidad: d.cantidad },
        update: { cantidad: d.cantidad },
      });
    }
  }

  return { ok: true };
}

export async function avanzarPasoAction(evalId: string, paso: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.inspeccion.update({ where: { id: evalId }, data: { pasoActual: paso } });
  return { ok: true };
}

export async function completarEvaluacionAction(evalId: string, jornadaId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await prisma.inspeccion.update({
    where: { id: evalId },
    data: { estado: "COMPLETA", pasoActual: 7 },
  });

  revalidatePath(`/jornadas/${jornadaId}`);
  redirect(`/jornadas/${jornadaId}`);
}

export async function uploadFotoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { fotos: [] };

  const evalId = String(formData.get("evalId") ?? "");
  const files = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);

  const created: { id: string; path: string }[] = [];
  for (const file of files.slice(0, 5)) {
    const path = await saveInspectionPhoto(evalId, file);
    if (path) {
      const foto = await prisma.foto.create({ data: { inspeccionId: evalId, path } });
      created.push({ id: foto.id, path: foto.path });
    }
  }
  return { fotos: created };
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getISOWeek } from "@/lib/calc";
import { saveInspectionPhoto } from "@/lib/uploads";

export type SaveInspectionResult = { error: string } | undefined;

export async function createInspectionAction(
  _prevState: SaveInspectionResult,
  formData: FormData
): Promise<SaveInspectionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const fechaStr = String(formData.get("fecha") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");
  const plantelId = String(formData.get("plantelId") ?? "") || null;
  const galpon = String(formData.get("galpon") ?? "").trim() || null;
  const sexo = String(formData.get("sexo") ?? "") || null;
  const cantidad = Number(formData.get("cantidad") ?? 0);
  const jabas = formData.get("jabas") ? Number(formData.get("jabas")) : null;
  const campania = String(formData.get("campania") ?? "").trim() || null;
  const nroGuia = String(formData.get("nroGuia") ?? "").trim() || null;
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;
  const metaPorcentaje = formData.get("metaPorcentaje")
    ? Number(formData.get("metaPorcentaje"))
    : 0.6;

  const verificadorId =
    user.role === "SUPERVISOR" && formData.get("verificadorId")
      ? String(formData.get("verificadorId"))
      : user.id;

  if (!fechaStr || !clienteId || !cantidad) {
    return { error: "Completa fecha, cliente y cantidad de aves." };
  }

  const fecha = new Date(fechaStr);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "Fecha inválida." };
  }

  const tiposDefecto = await prisma.tipoDefecto.findMany();

  const defectosData = tiposDefecto
    .map((tipo) => {
      const unidades = Number(formData.get(`defecto_${tipo.id}_unidades`) ?? 0) || 0;
      const kg = Number(formData.get(`defecto_${tipo.id}_kg`) ?? 0) || 0;
      return { tipoDefectoId: tipo.id, unidades, kg };
    })
    .filter((d) => d.unidades > 0 || d.kg > 0);

  const lesionesData = (["ALMOHADILLAS", "RASGUNOS"] as const).flatMap((categoria) =>
    (["MACHO", "HEMBRA"] as const)
      .map((sexo) => {
        const sinLesion = Number(formData.get(`lesion_${categoria}_${sexo}_sinLesion`) ?? 0) || 0;
        const leve = Number(formData.get(`lesion_${categoria}_${sexo}_leve`) ?? 0) || 0;
        const grave = Number(formData.get(`lesion_${categoria}_${sexo}_grave`) ?? 0) || 0;
        return { categoria, sexo, sinLesion, leve, grave, muestra: sinLesion + leve + grave };
      })
      .filter((l) => l.muestra > 0)
  );

  const inspeccion = await prisma.inspeccion.create({
    data: {
      fecha,
      anio: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      semana: getISOWeek(fecha),
      campania,
      nroGuia,
      clienteId,
      plantelId,
      galpon,
      sexo: sexo as "MACHO" | "HEMBRA" | "MIXTO" | null,
      jabas,
      cantidad,
      metaPorcentaje,
      observaciones,
      verificadorId,
      defectos: {
        create: defectosData,
      },
      evaluacionesLesion: {
        create: lesionesData,
      },
    },
  });

  const fotoLat = formData.get("fotoLat") ? Number(formData.get("fotoLat")) : null;
  const fotoLng = formData.get("fotoLng") ? Number(formData.get("fotoLng")) : null;

  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const fotosToCreate: { path: string }[] = [];
  for (const foto of fotos.slice(0, 5)) {
    const savedPath = await saveInspectionPhoto(inspeccion.id, foto);
    if (savedPath) fotosToCreate.push({ path: savedPath });
  }

  if (fotosToCreate.length > 0) {
    await prisma.foto.createMany({
      data: fotosToCreate.map((f) => ({
        inspeccionId: inspeccion.id,
        path: f.path,
        latitud: fotoLat,
        longitud: fotoLng,
      })),
    });
  }

  redirect(`/inspecciones/${inspeccion.id}`);
}

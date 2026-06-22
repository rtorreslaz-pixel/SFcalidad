import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Sexo = "MACHO" | "HEMBRA";
type LesionPayload = { grado0: number; grado1: number; grado2: number; muestra: number };
type LesionEvento = { sexo: Sexo; podo: LesionPayload | null; rasguno: LesionPayload | null };
type PigEvento = { sexo: Sexo; niveles: number[]; total: number };

type MergeItem = {
  keeper: string;
  loser: string;
  tipo: string;
  lesion: LesionEvento | null;
  pigmentacion: PigEvento | null;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const apply: boolean = body.apply === true;
  const plan: MergeItem[] = body.plan;
  if (!Array.isArray(plan)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const results: { keeper: string; loser: string; tipo: string; status: string; detail?: string }[] = [];

  for (const item of plan) {
    const [keeperInsp, loserInsp] = await Promise.all([
      prisma.inspeccion.findUnique({ where: { id: item.keeper } }),
      prisma.inspeccion.findUnique({ where: { id: item.loser } }),
    ]);
    if (!keeperInsp || !loserInsp) {
      results.push({ keeper: item.keeper, loser: item.loser, tipo: item.tipo, status: "error", detail: "keeper o loser no encontrado" });
      continue;
    }

    if (!apply) {
      results.push({ keeper: item.keeper, loser: item.loser, tipo: item.tipo, status: "dry-run-ok" });
      continue;
    }

    try {
      if (item.lesion) {
        const sexo = item.lesion.sexo;
        if (item.lesion.podo) {
          await prisma.evaluacionLesion.upsert({
            where: { inspeccionId_categoria_sexo: { inspeccionId: item.keeper, categoria: "ALMOHADILLAS", sexo } },
            create: {
              inspeccionId: item.keeper,
              categoria: "ALMOHADILLAS",
              sexo,
              muestra: item.lesion.podo.muestra,
              sinLesion: item.lesion.podo.grado0,
              leve: item.lesion.podo.grado1,
              grave: item.lesion.podo.grado2,
            },
            update: {
              muestra: item.lesion.podo.muestra,
              sinLesion: item.lesion.podo.grado0,
              leve: item.lesion.podo.grado1,
              grave: item.lesion.podo.grado2,
            },
          });
        }
        if (item.lesion.rasguno) {
          await prisma.evaluacionLesion.upsert({
            where: { inspeccionId_categoria_sexo: { inspeccionId: item.keeper, categoria: "RASGUNOS", sexo } },
            create: {
              inspeccionId: item.keeper,
              categoria: "RASGUNOS",
              sexo,
              muestra: item.lesion.rasguno.muestra,
              sinLesion: item.lesion.rasguno.grado0,
              leve: item.lesion.rasguno.grado1,
              grave: item.lesion.rasguno.grado2,
            },
            update: {
              muestra: item.lesion.rasguno.muestra,
              sinLesion: item.lesion.rasguno.grado0,
              leve: item.lesion.rasguno.grado1,
              grave: item.lesion.rasguno.grado2,
            },
          });
        }
      }

      if (item.pigmentacion) {
        const n = item.pigmentacion.niveles;
        await prisma.inspeccion.update({
          where: { id: item.keeper },
          data: {
            pigNivel0: n[0],
            pigNivel1: n[1],
            pigNivel2: n[2],
            pigNivel3: n[3],
            pigNivel4: n[4],
            pigNivel5: n[5],
            pigNivel6: n[6],
          },
        });
      }

      await prisma.inspeccion.delete({ where: { id: item.loser } });

      results.push({ keeper: item.keeper, loser: item.loser, tipo: item.tipo, status: "merged" });
    } catch (e) {
      results.push({
        keeper: item.keeper,
        loser: item.loser,
        tipo: item.tipo,
        status: "error",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ apply, results });
}

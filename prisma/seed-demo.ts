// Seed de DEMOSTRACIÓN. Genera datos de prueba realistas en todas las tablas
// operativas para mostrar la app funcionando de punta a punta (dashboard,
// inspecciones, jornadas, monitor de pesaje y engranaje granja-cliente).
//
// Se ejecuta SOLO cuando SEED_DEMO=true (lo llama prisma/seed.ts). Está pensado
// para el despliegue "demo" que se comparte con TI; NUNCA debe apuntarse a la
// base real, porque limpia y regenera las tablas operativas en cada corrida.
import type { PrismaClient } from "../src/generated/prisma/client";
import { randomUUID } from "crypto";

type Sexo = "MACHO" | "HEMBRA";

const CAMPANIAS = ["2603", "2705", "2801"];
const CORRALES = ["A", "B", "C", "D"];
const SEXOS: Sexo[] = ["MACHO", "HEMBRA"];

// ---- helpers ----
const rint = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const rfloat = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function gauss(mean: number, sd: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
const abbrevSexo = (s: Sexo) => (s === "MACHO" ? "M" : "H");
const normGalpon = (g: string) => (/^\d+$/.test(g) ? String(parseInt(g, 10)) : g.toUpperCase());
function buildComplex(p: { plantelCodigo: string; campania: string; galpon: string; sexo: Sexo; corral: string }) {
  return [p.plantelCodigo, p.campania, normGalpon(p.galpon), abbrevSexo(p.sexo), p.corral].join("-");
}

// Distribución de pigmentación (niveles 0..7) con promedio ~objetivo, como 8 conteos.
function pigDistrib(muestra: number, promedioObjetivo: number) {
  const niveles = new Array(8).fill(0) as number[];
  for (let i = 0; i < muestra; i++) {
    const n = clamp(Math.round(gauss(promedioObjetivo, 1.1)), 0, 7);
    niveles[n]++;
  }
  return niveles;
}

export async function sembrarDemo(prisma: PrismaClient) {
  console.log("SEED_DEMO=true -> generando datos de demostración...");

  // 1) Limpia tablas operativas (idempotente entre corridas del demo)
  await prisma.defectoRegistro.deleteMany({});
  await prisma.evaluacionLesion.deleteMany({});
  await prisma.hematomaDetalle.deleteMany({});
  await prisma.foto.deleteMany({});
  await prisma.saldoDiaAnterior.deleteMany({});
  await prisma.inspeccion.deleteMany({});
  await prisma.jornada.deleteMany({});
  await prisma.registroPesoPreventa.deleteMany({});
  await prisma.liveWeightReading.deleteMany({});

  // 2) Catálogos base (deben existir por el seed base)
  const clientes = await prisma.cliente.findMany();
  const planteles = await prisma.plantel.findMany();
  const verificadores = await prisma.user.findMany({ where: { role: "VERIFICADOR" } });
  const defectosSeleccion = await prisma.tipoDefecto.findMany({ where: { principal: true } });
  const defectosMerma = await prisma.tipoDefecto.findMany({
    where: { nombre: { in: ["Alas Grado 1°", "Pierna Grado 1°", "Alas Grado 2°"] } },
  });

  if (!clientes.length || !planteles.length || !verificadores.length) {
    console.log("  (faltan catálogos base; se omite el demo)");
    return;
  }

  // En el demo, los usuarios entran directo (sin forzar cambio de clave) para que
  // TI pueda navegar sin fricción. La clave sembrada es "demo1234".
  await prisma.user.updateMany({ data: { mustChangePassword: false } });

  // Asigna zona de evaluación a los clientes (el dashboard segmenta por esto)
  for (let i = 0; i < clientes.length; i++) {
    await prisma.cliente.update({
      where: { id: clientes[i].id },
      data: { zonaEvaluacion: i % 2 === 0 ? "CD-LIMA" : "SUR-LIMA" },
    });
  }

  const hoy = new Date();
  const diaMs = 86400000;

  // Sesgo por plantel para que los rankings tengan variedad
  const sesgoPlantel = new Map<string, number>();
  for (const p of planteles) sesgoPlantel.set(p.id, rfloat(0.5, 1.6));

  type Lote = { plantel: (typeof planteles)[number]; cliente: (typeof clientes)[number]; verificador: (typeof verificadores)[number]; campania: string; galpon: string; corral: string; sexo: Sexo; fecha: Date; };

  const lotesParaPeso: Lote[] = [];
  let totalInsp = 0;

  async function crearInspeccion(lote: Lote, jornadaId: string | null) {
    const { plantel, cliente, verificador, campania, galpon, corral, sexo, fecha } = lote;
    const sesgo = sesgoPlantel.get(plantel.id) ?? 1;
    const cantidad = rint(800, 4200);

    // Selección: ~0.6% de la cantidad, repartida en 1-3 defectos no-merma
    const pctSelObjetivo = clamp(gauss(0.6 * sesgo, 0.25), 0.05, 2.2) / 100;
    let restanteSel = Math.round(cantidad * pctSelObjetivo);
    const nDef = rint(1, 3);
    const defectosCreate: { tipoDefectoId: string; unidades: number; kg: number }[] = [];
    for (let k = 0; k < nDef && restanteSel > 0; k++) {
      const u = k === nDef - 1 ? restanteSel : rint(0, restanteSel);
      restanteSel -= u;
      if (u > 0) defectosCreate.push({ tipoDefectoId: pick(defectosSeleccion).id, unidades: u, kg: Number((u * rfloat(1.6, 2.4)).toFixed(1)) });
    }
    // Un defecto de merma ocasional
    if (Math.random() < 0.4 && defectosMerma.length) {
      const u = rint(1, Math.max(2, Math.round(cantidad * 0.004)));
      defectosCreate.push({ tipoDefectoId: pick(defectosMerma).id, unidades: u, kg: Number((u * 2).toFixed(1)) });
    }
    // Deduplica por tipoDefecto (unique inspeccion+tipoDefecto)
    const dedup = new Map<string, { tipoDefectoId: string; unidades: number; kg: number }>();
    for (const d of defectosCreate) {
      const e = dedup.get(d.tipoDefectoId);
      if (e) { e.unidades += d.unidades; e.kg += d.kg; } else dedup.set(d.tipoDefectoId, { ...d });
    }

    // Pigmentación (promedio ~3.0-3.5)
    const muestraPig = rint(60, 120);
    const niveles = pigDistrib(muestraPig, clamp(gauss(3.25, 0.35), 2.2, 4.2));

    // Pododermatitis y rasguños (% grado 2)
    const muestraAlm = rint(50, 100);
    const graveAlm = clamp(Math.round(muestraAlm * clamp(gauss(0.11 * sesgo, 0.05), 0, 0.4)), 0, muestraAlm);
    const leveAlm = clamp(rint(0, muestraAlm - graveAlm), 0, muestraAlm - graveAlm);
    const muestraRas = rint(50, 100);
    const graveRas = clamp(Math.round(muestraRas * clamp(gauss(0.10 * sesgo, 0.05), 0, 0.4)), 0, muestraRas);
    const leveRas = clamp(rint(0, muestraRas - graveRas), 0, muestraRas - graveRas);

    // Hematomas (~8%)
    const hemSin = rint(40, 90);
    const hemCon = clamp(Math.round(hemSin * clamp(gauss(0.08 * sesgo, 0.04), 0, 0.4)), 0, hemSin);

    const complex = buildComplex({ plantelCodigo: plantel.codigo, campania, galpon, sexo, corral });

    await prisma.inspeccion.create({
      data: {
        ...(jornadaId ? { jornada: { connect: { id: jornadaId } } } : {}),
        fecha, anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, semana: isoWeek(fecha),
        campania,
        cliente: { connect: { id: cliente.id } },
        verificador: { connect: { id: verificador.id } },
        plantel: { connect: { id: plantel.id } },
        metaPorcentaje: 0.6,
        galpon: normGalpon(galpon), corral, sexo, cantidad, jabas: Math.round(cantidad / 20),
        complex, estado: "COMPLETA", pasoActual: 7, soloLesionPigmentacion: false,
        tempCamion: Number(gauss(4, 1.4).toFixed(1)),
        tempPlataforma: Number(gauss(5, 1.4).toFixed(1)),
        tempAves: Number(gauss(6, 1.2).toFixed(1)),
        hematomasCon: hemCon, hematomasSin: hemSin,
        pigNivel0: niveles[0], pigNivel1: niveles[1], pigNivel2: niveles[2], pigNivel3: niveles[3],
        pigNivel4: niveles[4], pigNivel5: niveles[5], pigNivel6: niveles[6], pigNivel7: niveles[7],
        defectos: { create: [...dedup.values()] },
        evaluacionesLesion: {
          create: [
            { categoria: "ALMOHADILLAS", sexo, muestra: muestraAlm, sinLesion: muestraAlm - graveAlm - leveAlm, leve: leveAlm, grave: graveAlm },
            { categoria: "RASGUNOS", sexo, muestra: muestraRas, sinLesion: muestraRas - graveRas - leveRas, leve: leveRas, grave: graveRas },
          ],
        },
        hematomaDetalles: hemCon > 0 ? { create: [{ grado: "GRADO2", ubicacion: pick(["ALA", "PECHUGA", "PIERNA"] as const), cantidad: hemCon }] } : undefined,
      },
    });
    totalInsp++;
    if (Math.random() < 0.55) lotesParaPeso.push(lote);
  }

  // 3) Jornadas con sus inspecciones (últimas ~3 semanas)
  console.log("  jornadas + inspecciones...");
  const NUM_JORNADAS = 16;
  for (let j = 0; j < NUM_JORNADAS; j++) {
    const fecha = new Date(hoy.getTime() - rint(0, 20) * diaMs);
    const cliente = pick(clientes);
    const verificador = pick(verificadores);
    const jornada = await prisma.jornada.create({
      data: {
        fecha, anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, semana: isoWeek(fecha),
        cliente: { connect: { id: cliente.id } },
        verificador: { connect: { id: verificador.id } },
      },
    });
    const n = rint(4, 9);
    for (let i = 0; i < n; i++) {
      await crearInspeccion(
        { plantel: pick(planteles), cliente, verificador, campania: pick(CAMPANIAS), galpon: String(rint(1, 14)), corral: pick(CORRALES), sexo: pick(SEXOS), fecha },
        jornada.id,
      );
    }
  }

  // 4) Inspecciones sueltas (historial de ~8 semanas para tendencias)
  console.log("  inspecciones sueltas (historial)...");
  const NUM_SUELTAS = 95;
  for (let i = 0; i < NUM_SUELTAS; i++) {
    const fecha = new Date(hoy.getTime() - rint(0, 56) * diaMs);
    await crearInspeccion(
      { plantel: pick(planteles), cliente: pick(clientes), verificador: pick(verificadores), campania: pick(CAMPANIAS), galpon: String(rint(1, 14)), corral: pick(CORRALES), sexo: pick(SEXOS), fecha },
      null,
    );
  }

  // 5) Pesajes preventa históricos para el mismo lote (engranaje granja-cliente)
  console.log("  pesajes preventa (trazabilidad)...");
  let numAve = 1;
  for (const lote of lotesParaPeso) {
    const complex = buildComplex({ plantelCodigo: lote.plantel.codigo, campania: lote.campania, galpon: lote.galpon, sexo: lote.sexo, corral: lote.corral });
    const media = lote.sexo === "MACHO" ? 2760 : 2450;
    const aves = rint(2, 5);
    for (let a = 0; a < aves; a++) {
      await prisma.registroPesoPreventa.create({
        data: {
          id: randomUUID(),
          plantel: { connect: { id: lote.plantel.id } },
          verificador: { connect: { id: lote.verificador.id } },
          campania: lote.campania, galpon: normGalpon(lote.galpon), corral: lote.corral,
          categoria: lote.sexo, numeroAve: numAve++, pesoGramos: Number(gauss(media, 90).toFixed(0)),
          fechaHora: lote.fecha, complex, linea: "Ross", lote: "A", edad: rint(38, 46), nAvesPorPesada: 1,
          tieneHematoma: Math.random() < 0.09, tieneDefectoSeleccion: Math.random() < 0.06,
          gradoPododermatitis: pick([0, 0, 0, 1, 2]), gradoRasguno: pick([0, 0, 1, 2]), pigmentacion: clamp(Math.round(gauss(3.3, 1)), 0, 7),
        },
      });
    }
  }

  // 6) Básculas "en vivo" hoy + sus pesajes de hoy (monitor de pesaje)
  console.log("  monitor de pesaje en vivo...");
  const enVivo = verificadores.slice(0, Math.min(8, verificadores.length));
  for (const v of enVivo) {
    const plantel = pick(planteles);
    const campania = pick(CAMPANIAS);
    const galpon = String(rint(1, 14));
    const corral = pick(CORRALES);
    const sexo = pick(SEXOS);
    const complex = buildComplex({ plantelCodigo: plantel.codigo, campania, galpon, sexo, corral });
    const media = sexo === "MACHO" ? 2760 : 2450;
    const avesHoy = rint(30, 90);
    for (let a = 0; a < avesHoy; a++) {
      await prisma.registroPesoPreventa.create({
        data: {
          id: randomUUID(),
          plantel: { connect: { id: plantel.id } },
          verificador: { connect: { id: v.id } },
          campania, galpon: normGalpon(galpon), corral, categoria: sexo,
          numeroAve: numAve++, pesoGramos: Number(gauss(media, 85).toFixed(0)),
          fechaHora: new Date(hoy.getTime() - rint(0, 3) * 3600000), complex, linea: "Ross", lote: "A",
          edad: rint(40, 46), nAvesPorPesada: 1, tieneHematoma: Math.random() < 0.08,
        },
      });
    }
    await prisma.liveWeightReading.create({
      data: {
        verificador: { connect: { id: v.id } },
        pesoGramos: Number(gauss(media, 60).toFixed(0)),
        plantelCodigo: plantel.codigo, campania, galpon: normGalpon(galpon), corral, categoria: sexo, complex,
      },
    });
  }

  const totalPeso = await prisma.registroPesoPreventa.count();
  console.log(`  demo listo: ${totalInsp} inspecciones, ${totalPeso} pesajes, ${enVivo.length} básculas en vivo.`);
}

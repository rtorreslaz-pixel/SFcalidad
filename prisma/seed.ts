import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const TIPOS_DEFECTO: { nombre: string; categoria: string; orden: number; principal?: boolean }[] = [
  { nombre: "Mío Pectoral", categoria: "Miopatías", orden: 1, principal: true },
  { nombre: "Mío Dorsal", categoria: "Miopatías", orden: 2, principal: true },
  { nombre: "Menor Peso", categoria: "General", orden: 3, principal: true },
  { nombre: "Deshidratado", categoria: "General", orden: 4 },
  { nombre: "Celulitis Abdominal", categoria: "General", orden: 5 },
  { nombre: "Golpeados Alas/Espalda", categoria: "Golpes", orden: 6, principal: true },
  { nombre: "Golpes Pechuga", categoria: "Golpes", orden: 7, principal: true },
  { nombre: "Golpes Pierna", categoria: "Golpes", orden: 8, principal: true },
  { nombre: "Úlceras", categoria: "General", orden: 9 },
  { nombre: "Buchón", categoria: "General", orden: 10 },
  { nombre: "Rasguños Severos", categoria: "General", orden: 11 },
  { nombre: "Pechuga Madera", categoria: "Miopatías", orden: 12 },
  { nombre: "Alas Grado 1°", categoria: "Alas", orden: 13 },
  { nombre: "Alas Grado 2°", categoria: "Alas", orden: 14 },
  { nombre: "Alas Grado 3°", categoria: "Alas", orden: 15 },
  { nombre: "Alas Rota", categoria: "Alas", orden: 16 },
  { nombre: "Pierna Grado 1°", categoria: "Pierna", orden: 17 },
  { nombre: "Pierna Grado 2°", categoria: "Pierna", orden: 18 },
  { nombre: "Pierna Grado 3°", categoria: "Pierna", orden: 19 },
  { nombre: "Pierna Rota", categoria: "Pierna", orden: 20 },
  { nombre: "Ascitis", categoria: "General", orden: 21 },
  { nombre: "Tarso Inflamado", categoria: "General", orden: 22 },
  { nombre: "Mutilados", categoria: "General", orden: 23 },
  { nombre: "Alas Mutiladas", categoria: "Alas", orden: 24 },
  { nombre: "Piernas Mutiladas", categoria: "Pierna", orden: 25 },
];

// Clientes: destinos donde se vende el pollo a diario (independiente de los planteles).
const CLIENTES = [
  "AKIM",
  "AVISUR",
  "JOSMEL",
  "KILITO",
  "LUCARVI",
  "MAMALIDIA",
  "NEGAVISUR",
  "PAOLO CARRILLO",
  "PASVELA",
  "VALENTINA",
  "VICTOR TOMÁS",
  "ALEJANDRO",
  "ANTON",
  "CHRISS",
  "JAYO",
  "LA ENCANTADA",
  "MAMA JULITA",
  "ALCANTARA",
  "AVICOLA CRUZ",
  "VEKITO",
  "BALIAN",
];

// Plantel -> Zona, SubZona, TipoPlantel, ZonaEvaluacion (extraido de hoja ZONAS). Los
// planteles son galpones/almacenes y no tienen relación con los clientes.
const PLANTELES: {
  codigo: string;
  zona: string | null;
  subZona: string | null;
  tipoPlantel: string | null;
  zonaEvaluacion: string | null;
}[] = [
  { codigo: "P006", zona: "Sur", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P016", zona: "Sur", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P051", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P052", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P054", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P055", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P056", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P057", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P058", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P120", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P121", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P123", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P124", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P126", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P127", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P153", zona: "Centro", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P155", zona: "Centro", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P186", zona: "Sur", subZona: "PISCO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P201", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P202", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P204", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P205", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P206", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P208", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P209", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P210", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P211", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P212", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P216", zona: "Norte", subZona: "HAWAI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P236", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P238", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P240", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P241", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P242", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P244", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P245", zona: "Norte", subZona: "RIO SECO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P249", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P250", zona: "Norte", subZona: "RIO SECO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P251", zona: "Norte", subZona: "RIO SECO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P252", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P253", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P255", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P256", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P257", zona: "Norte", subZona: "MEDIO MUNDO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P258", zona: "Norte", subZona: "RIO SECO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P259", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P260", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P261", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P262", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P263", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P264", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P265", zona: "Norte", subZona: "RIO SECO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P267", zona: "Norte", subZona: "HATILLO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P268", zona: "Norte", subZona: "HATILLO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P269", zona: "Norte", subZona: "HATILLO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P271", zona: "Norte", subZona: "HUANCHACO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P272", zona: "Norte", subZona: "HUANCHACO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P273", zona: "Norte", subZona: "HATILLO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P277", zona: "Norte", subZona: "HAWAI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P278", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P279", zona: "Norte", subZona: "PLAYA GRANDE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P280", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P281", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P287", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P288", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P289", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P293", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P294", zona: "Norte", subZona: "HUAYAN", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P295", zona: "Norte", subZona: "TOSHI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P296", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P299", zona: "Norte", subZona: "HUAYAN", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P300", zona: "Norte", subZona: "HUAYAN", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P301", zona: "Norte", subZona: "HUAYAN", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P302", zona: "Norte", subZona: "HUAYAN", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P325", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P350", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P352", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P357", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P358", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P365", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P366", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P368", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P370", zona: "Sur", subZona: "PISCO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P384", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P385", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P386", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P387", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P390", zona: "Sur", subZona: "PAUNA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P393", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P394", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P402", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P403", zona: "Sur", subZona: "OCUCAJE", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P500", zona: "Norte", subZona: "ESQUIVEL", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P501", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P502", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P503", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P504", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P700", zona: "Norte", subZona: "BUENA VISTA", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P701", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P702", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P703", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P704", zona: "Norte", subZona: "HUARAL", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P705", zona: "Norte", subZona: "HUARAL", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P706", zona: "Norte", subZona: "LUCHIHUASI", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P708", zona: "Norte", subZona: "HATILLO", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P248", zona: "Norte", subZona: "MARGARET", tipoPlantel: "CONVENCIONAL", zonaEvaluacion: null },
  { codigo: "P801", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P804", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P805", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P806", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P807", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "P810", zona: "Sur", subZona: "CABEZA TORO", tipoPlantel: "CLIMATIZADO", zonaEvaluacion: null },
  { codigo: "PONE", zona: "COMPRA", subZona: "COMPRA", tipoPlantel: "COMPRA", zonaEvaluacion: null },
];

const VERIFICADORES = [
  { nombre: "Verificador 1", email: "verificador1@avicola.com" },
  { nombre: "Verificador 2", email: "verificador2@avicola.com" },
  { nombre: "Verificador 3", email: "verificador3@avicola.com" },
  { nombre: "Verificador 4", email: "verificador4@avicola.com" },
  { nombre: "Verificador 5", email: "verificador5@avicola.com" },
  { nombre: "Verificador 6", email: "verificador6@avicola.com" },
  { nombre: "Verificador 7", email: "verificador7@avicola.com" },
  { nombre: "Verificador 8", email: "verificador8@avicola.com" },
  { nombre: "Verificador 9", email: "verificador9@avicola.com" },
  { nombre: "Verificador 10", email: "verificador10@avicola.com" },
];

const DEFAULT_PASSWORD = "demo1234";

// Pesos estándar Ross 308 (fuente: Aviagen Ross 308 Broiler Performance Objectives 2022)
// Base diaria interpolada linealmente entre los valores semanales oficiales.
// Reemplazar con la tabla STD del cliente una vez disponible.
function generarPesosRoss308(): { linea: string; sexo: "MACHO" | "HEMBRA"; edadDias: number; pesoGramos: number }[] {
  const benchmarks: Record<"MACHO" | "HEMBRA", { dia: number; peso: number }[]> = {
    MACHO: [
      { dia: 0, peso: 42 }, { dia: 7, peso: 198 }, { dia: 14, peso: 493 },
      { dia: 21, peso: 995 }, { dia: 28, peso: 1660 }, { dia: 35, peso: 2441 },
      { dia: 42, peso: 3230 }, { dia: 49, peso: 3958 },
    ],
    HEMBRA: [
      { dia: 0, peso: 42 }, { dia: 7, peso: 183 }, { dia: 14, peso: 444 },
      { dia: 21, peso: 872 }, { dia: 28, peso: 1413 }, { dia: 35, peso: 2038 },
      { dia: 42, peso: 2673 }, { dia: 49, peso: 3252 },
    ],
  };

  const result: { linea: string; sexo: "MACHO" | "HEMBRA"; edadDias: number; pesoGramos: number }[] = [];
  for (const sexo of ["MACHO", "HEMBRA"] as const) {
    const pts = benchmarks[sexo];
    for (let i = 0; i < pts.length - 1; i++) {
      const { dia: d0, peso: p0 } = pts[i];
      const { dia: d1, peso: p1 } = pts[i + 1];
      for (let dia = d0; dia < d1; dia++) {
        const t = (dia - d0) / (d1 - d0);
        result.push({ linea: "Ross", sexo, edadDias: dia, pesoGramos: Math.round(p0 + t * (p1 - p0)) });
      }
    }
    const last = pts[pts.length - 1];
    result.push({ linea: "Ross", sexo, edadDias: last.dia, pesoGramos: last.peso });
  }
  return result;
}

async function main() {
  console.log("Sembrando tipos de defecto...");
  for (const tipo of TIPOS_DEFECTO) {
    const principal = tipo.principal ?? false;
    await prisma.tipoDefecto.upsert({
      where: { nombre: tipo.nombre },
      update: { categoria: tipo.categoria, orden: tipo.orden, principal },
      create: { ...tipo, principal },
    });
  }

  console.log("Sembrando clientes...");
  for (const nombre of CLIENTES) {
    await prisma.cliente.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log("Sembrando planteles...");
  for (const p of PLANTELES) {
    await prisma.plantel.upsert({
      where: { codigo: p.codigo },
      update: {
        zona: p.zona,
        subZona: p.subZona,
        tipoPlantel: p.tipoPlantel,
        zonaEvaluacion: p.zonaEvaluacion,
      },
      create: {
        codigo: p.codigo,
        zona: p.zona,
        subZona: p.subZona,
        tipoPlantel: p.tipoPlantel,
        zonaEvaluacion: p.zonaEvaluacion,
      },
    });
  }

  console.log("Sembrando usuarios...");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: "supervisor@avicola.com" },
    update: {},
    create: {
      nombre: "Supervisor de Calidad",
      email: "supervisor@avicola.com",
      passwordHash,
      role: "SUPERVISOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "jefe@avicola.com" },
    update: {},
    create: {
      nombre: "Jefe de Calidad",
      email: "jefe@avicola.com",
      passwordHash,
      role: "JEFE",
    },
  });

  for (const v of VERIFICADORES) {
    await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        nombre: v.nombre,
        email: v.email,
        passwordHash,
        role: "VERIFICADOR",
      },
    });
  }

  console.log("Sembrando muestras de peso preventa...");
  const planteles = await prisma.plantel.findMany({ where: { codigo: { in: ["P006", "P016", "P051"] } } });
  const verificadores = await prisma.user.findMany({ where: { role: "VERIFICADOR" } });
  const categorias = ["MACHO", "HEMBRA", "MEDIANO"] as const;
  const pesoBaseGramos: Record<(typeof categorias)[number], number> = {
    MACHO: 2100,
    HEMBRA: 1750,
    MEDIANO: 1900,
  };

  const ahora = new Date();
  let numeroAve = 0;
  for (const plantel of planteles) {
    for (const galpon of ["1", "2"]) {
      for (const corral of ["A", "B"]) {
        for (const categoria of categorias) {
          numeroAve += 1;
          const verificador = verificadores[numeroAve % verificadores.length];
          const peso = pesoBaseGramos[categoria] + (Math.random() - 0.5) * 200;
          const fechaHora = new Date(ahora.getTime() - numeroAve * 5 * 60 * 1000);

          await prisma.registroPesoPreventa.upsert({
            where: { id: `seed-${plantel.codigo}-${galpon}-${corral}-${categoria}` },
            update: {},
            create: {
              id: `seed-${plantel.codigo}-${galpon}-${corral}-${categoria}`,
              plantelId: plantel.id,
              galpon,
              corral,
              categoria,
              numeroAve,
              pesoGramos: Math.round(peso * 10) / 10,
              fechaHora,
              verificadorId: verificador.id,
            },
          });
        }
      }
    }
  }

  console.log("Sembrando pesos estándar Ross 308...");
  const pesosRoss = generarPesosRoss308();
  for (const p of pesosRoss) {
    await prisma.pesoEstandar.upsert({
      where: { linea_sexo_edadDias: { linea: p.linea, sexo: p.sexo, edadDias: p.edadDias } },
      update: { pesoGramos: p.pesoGramos },
      create: p,
    });
  }

  console.log("Listo. Usuarios creados con contraseña por defecto:", DEFAULT_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

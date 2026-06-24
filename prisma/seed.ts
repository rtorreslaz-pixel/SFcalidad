import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const TIPOS_DEFECTO: { nombre: string; categoria: string; orden: number }[] = [
  { nombre: "Mío Pectoral", categoria: "Miopatías", orden: 1 },
  { nombre: "Mío Dorsal", categoria: "Miopatías", orden: 2 },
  { nombre: "Menor Peso", categoria: "General", orden: 3 },
  { nombre: "Deshidratado", categoria: "General", orden: 4 },
  { nombre: "Celulitis Abdominal", categoria: "General", orden: 5 },
  { nombre: "Golpeados Alas/Espalda", categoria: "Golpes", orden: 6 },
  { nombre: "Golpes Pechuga", categoria: "Golpes", orden: 7 },
  { nombre: "Golpes Pierna", categoria: "Golpes", orden: 8 },
  { nombre: "Úlceras", categoria: "General", orden: 9 },
  { nombre: "Buchón", categoria: "General", orden: 10 },
  { nombre: "Mutilados", categoria: "General", orden: 11 },
  { nombre: "Rasguños Severos", categoria: "General", orden: 12 },
  { nombre: "Alas Grado 1°", categoria: "Alas", orden: 13 },
  { nombre: "Alas Grado 2°", categoria: "Alas", orden: 14 },
  { nombre: "Alas Grado 3°", categoria: "Alas", orden: 15 },
  { nombre: "Alas Rota", categoria: "Alas", orden: 16 },
  { nombre: "Alas Mutiladas", categoria: "Alas", orden: 17 },
  { nombre: "Pierna Grado 1°", categoria: "Pierna", orden: 18 },
  { nombre: "Pierna Grado 2°", categoria: "Pierna", orden: 19 },
  { nombre: "Pierna Grado 3°", categoria: "Pierna", orden: 20 },
  { nombre: "Pierna Rota", categoria: "Pierna", orden: 21 },
  { nombre: "Piernas Mutiladas", categoria: "Pierna", orden: 22 },
];

// Plantel -> Zona, SubZona, TipoPlantel, Cliente, ZonaEvaluacion (extraido de hoja ZONAS)
const PLANTELES: {
  codigo: string;
  zona: string;
  subZona: string;
  tipoPlantel: string;
  cliente: string;
  zonaEvaluacion: string;
}[] = [
  { codigo: "P006", zona: "Sur", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", cliente: "AKIM", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P016", zona: "Sur", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", cliente: "AVISUR", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P051", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "JOSMEL", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P052", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "KILITO", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P054", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "LUCARVI", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P055", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "MAMALIDIA", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P056", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "NEGAVISUR", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P057", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "PAOLO CARRILLO", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P058", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "PASVELA", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P120", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", cliente: "VALENTINA", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P121", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", cliente: "VICTOR TOMÁS", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P123", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", cliente: "ALEJANDRO", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P124", zona: "Norte", subZona: "CANTA", tipoPlantel: "CONVENCIONAL", cliente: "ANTON", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P126", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "CHRISS", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P127", zona: "Centro", subZona: "ASIA", tipoPlantel: "CONVENCIONAL", cliente: "JAYO", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P153", zona: "Centro", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", cliente: "LA ENCANTADA", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P155", zona: "Centro", subZona: "CHILCA", tipoPlantel: "CONVENCIONAL", cliente: "MAMA JULITA", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P186", zona: "Sur", subZona: "PISCO", tipoPlantel: "CONVENCIONAL", cliente: "ALCANTARA", zonaEvaluacion: "SUR-LIMA" },
  { codigo: "P201", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CONVENCIONAL", cliente: "AVICOLA CRUZ", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P202", zona: "Norte", subZona: "SANTA ROSA", tipoPlantel: "CONVENCIONAL", cliente: "VEKITO", zonaEvaluacion: "CD-LIMA" },
  { codigo: "P204", zona: "Norte", subZona: "TRIGALES", tipoPlantel: "CONVENCIONAL", cliente: "BALIAN", zonaEvaluacion: "CD-LIMA" },
];

const VERIFICADORES = [
  { nombre: "Verificador 1", email: "verificador1@avicola.com" },
  { nombre: "Verificador 2", email: "verificador2@avicola.com" },
  { nombre: "Verificador 3", email: "verificador3@avicola.com" },
  { nombre: "Verificador 4", email: "verificador4@avicola.com" },
  { nombre: "Verificador 5", email: "verificador5@avicola.com" },
  { nombre: "Verificador 6", email: "verificador6@avicola.com" },
];

const DEFAULT_PASSWORD = "demo1234";

async function main() {
  console.log("Sembrando tipos de defecto...");
  for (const tipo of TIPOS_DEFECTO) {
    await prisma.tipoDefecto.upsert({
      where: { nombre: tipo.nombre },
      update: { categoria: tipo.categoria, orden: tipo.orden },
      create: tipo,
    });
  }

  console.log("Sembrando clientes y planteles...");
  for (const p of PLANTELES) {
    const cliente = await prisma.cliente.upsert({
      where: { nombre: p.cliente },
      update: {},
      create: { nombre: p.cliente },
    });

    await prisma.plantel.upsert({
      where: { codigo: p.codigo },
      update: {
        zona: p.zona,
        subZona: p.subZona,
        tipoPlantel: p.tipoPlantel,
        zonaEvaluacion: p.zonaEvaluacion,
        clienteId: cliente.id,
      },
      create: {
        codigo: p.codigo,
        zona: p.zona,
        subZona: p.subZona,
        tipoPlantel: p.tipoPlantel,
        zonaEvaluacion: p.zonaEvaluacion,
        clienteId: cliente.id,
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

// Prueba de humo: usa el cliente Prisma generado para SQL Server (a través del
// driver adapter @prisma/adapter-mssql) para escribir y leer datos reales en el
// SQL Server del contenedor. Demuestra que la app puede operar sobre SQL Server,
// no solo que el esquema se crea.
//
//   node migration-spike/smoke-test.mjs
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "./generated/client.ts";

const adapter = new PrismaMssql({
  server: "localhost",
  port: 1433,
  user: "sa",
  password: "Spike_Passw0rd!",
  database: "sanfernando_spike",
  options: { encrypt: true, trustServerCertificate: true },
});

const prisma = new PrismaClient({ adapter });

function assert(label, cond) {
  if (!cond) throw new Error("FALLÓ: " + label);
  console.log("  ok:", label);
}

async function main() {
  console.log("Prueba de humo contra SQL Server\n");

  // Limpieza previa por si se corre dos veces
  await prisma.registroPesoPreventa.deleteMany({});
  await prisma.inspeccion.deleteMany({});
  await prisma.plantel.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("1. Crear usuario (verificador)");
  const user = await prisma.user.create({
    data: { nombre: "Verificador Spike", email: "spike@sf.test", passwordHash: "x", role: "VERIFICADOR" },
  });
  assert("usuario creado con id cuid", typeof user.id === "string" && user.id.length > 0);

  console.log("2. Crear cliente + plantel (relaciones y FK)");
  const cliente = await prisma.cliente.create({ data: { nombre: "VALENTINA", zonaEvaluacion: "CD-LIMA" } });
  const plantel = await prisma.plantel.create({
    data: { codigo: "P280", nombre: "Plantel 280", clienteId: cliente.id },
  });
  assert("plantel enlazado a cliente", plantel.clienteId === cliente.id);

  console.log("3. Insertar pesos preventa (índices compuestos + enum-como-texto)");
  const base = new Date("2026-07-08T12:00:00Z");
  await prisma.registroPesoPreventa.createMany({
    data: Array.from({ length: 50 }, (_, i) => ({
      id: "spike-" + i,
      plantelId: plantel.id,
      campania: "2603",
      galpon: "9",
      corral: "CA",
      categoria: "MACHO",
      numeroAve: i + 1,
      pesoGramos: 2700 + i,
      fechaHora: base,
      complex: "P280-2603-9-M-CA",
      verificadorId: user.id,
    })),
  });
  const total = await prisma.registroPesoPreventa.count();
  assert("50 registros de peso insertados", total === 50);

  console.log("4. Consulta agregada (promedio de peso del lote)");
  const agg = await prisma.registroPesoPreventa.aggregate({
    _avg: { pesoGramos: true },
    _count: true,
    where: { plantelId: plantel.id, galpon: "9", corral: "CA", categoria: "MACHO" },
  });
  assert("agregación cuenta 50", agg._count === 50);
  assert("promedio en rango esperado", agg._avg.pesoGramos > 2700 && agg._avg.pesoGramos < 2800);
  console.log("     promedio del lote:", (agg._avg.pesoGramos / 1000).toFixed(3), "kg");

  console.log("5. Join con include (trazabilidad plantel→cliente)");
  const conCliente = await prisma.plantel.findFirst({
    where: { codigo: "P280" },
    include: { cliente: true, _count: { select: { registrosPesoPreventa: true } } },
  });
  assert("join trae el cliente", conCliente?.cliente?.nombre === "VALENTINA");
  assert("conteo de registros por plantel = 50", conCliente?._count.registrosPesoPreventa === 50);

  console.log("6. Update + unique constraint (LiveWeightReading por verificador)");
  await prisma.liveWeightReading.upsert({
    where: { verificadorId: user.id },
    create: { verificadorId: user.id, pesoGramos: 2750, complex: "P280-2603-9-M-CA" },
    update: { pesoGramos: 2760 },
  });
  const live = await prisma.liveWeightReading.findUnique({ where: { verificadorId: user.id } });
  assert("upsert de lectura en vivo", live?.pesoGramos === 2750);

  console.log("\n✅ TODAS LAS PRUEBAS PASARON sobre SQL Server");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error("\n❌ ERROR:", e.message); await prisma.$disconnect(); process.exit(1); });

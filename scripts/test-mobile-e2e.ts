// Prueba de extremo a extremo de /api/mobile/* contra un servidor de desarrollo real
// y la base de datos real (sin mocks). Requiere "npm run dev" corriendo y un usuario
// VERIFICADOR sembrado por prisma/seed.ts.
//
// ADVERTENCIA: revoca y vuelve a generar el apiToken del usuario de prueba, y pisa su
// LiveWeightReading. Solo correr contra una base de datos de desarrollo, nunca producción.
//
// Uso: npx tsx scripts/test-mobile-e2e.ts
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.MOBILE_E2E_BASE_URL ?? "http://127.0.0.1:3000";
const TEST_EMAIL = process.env.MOBILE_E2E_EMAIL ?? "verificador10@avicola.com";
const TEST_PASSWORD = process.env.MOBILE_E2E_PASSWORD ?? "demo1234";
const TEST_CAMPANIA = "C-E2E";

let passed = 0;
function check(label: string, condition: boolean) {
  if (!condition) throw new Error(`FALLÓ: ${label}`);
  passed++;
  console.log(`  ok: ${label}`);
}

async function main() {
  console.log(`Probando ${BASE_URL} como ${TEST_EMAIL}\n`);

  console.log("1. Login");
  const loginRes = await fetch(`${BASE_URL}/api/mobile/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  check("login responde 200", loginRes.status === 200);
  const { token, user } = await loginRes.json();
  check("login devuelve token", typeof token === "string" && token.length > 0);

  console.log("2. Catálogo (incluye planteles con nombre null)");
  const catalogRes = await fetch(`${BASE_URL}/api/mobile/catalogos`, {
    headers: { authorization: `Bearer ${token}` },
  });
  check("catalogos responde 200", catalogRes.status === 200);
  const catalogos = await catalogRes.json();
  check("catalogos trae al menos un plantel", catalogos.planteles.length > 0);
  const plantelNombreNull = catalogos.planteles.find((p: { nombre: string | null }) => p.nombre === null);
  check("al menos un plantel tiene nombre null (contrato real)", !!plantelNombreNull);
  const plantel = plantelNombreNull ?? catalogos.planteles[0];

  console.log("3. numeroAve máximo en servidor antes de registrar (debe ser null)");
  const maxBeforeRes = await fetch(
    `${BASE_URL}/api/mobile/numero-ave-max?plantelId=${plantel.id}&campania=${TEST_CAMPANIA}&galpon=G-E2E&corral=1&categoria=MACHO`,
    { headers: { authorization: `Bearer ${token}` } }
  );
  check("numero-ave-max responde 200", maxBeforeRes.status === 200);
  const { maxNumeroAve: maxBefore } = await maxBeforeRes.json();
  check("sin registros previos, maxNumeroAve es null", maxBefore === null);

  console.log("4. Registrar ave con variables de calidad");
  const registroId = randomUUID();
  const fechaHora = new Date().toISOString();
  const registroBody = {
    registros: [
      {
        id: registroId,
        plantelId: plantel.id,
        campania: TEST_CAMPANIA,
        galpon: "G-E2E",
        corral: "1",
        categoria: "MACHO",
        numeroAve: 1,
        pesoGramos: 2500,
        fechaHora,
        tieneHematoma: true,
        tieneDefectoSeleccion: false,
        gradoPododermatitis: 1,
        gradoRasguno: 2,
        pigmentacion: 5,
      },
    ],
  };
  const registroRes = await fetch(`${BASE_URL}/api/mobile/registros`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(registroBody),
  });
  check("registros responde 200", registroRes.status === 200);
  const registroJson = await registroRes.json();
  check("registros ingirió 1", registroJson.ingested === 1);

  const stored = await prisma.registroPesoPreventa.findUnique({ where: { id: registroId } });
  check("el registro existe en la base", stored !== null);
  check("verificadorId es el del token, no del body", stored?.verificadorId === user.id);
  check("pesoGramos persistido correctamente", stored?.pesoGramos === 2500);
  check("tieneHematoma persistido", stored?.tieneHematoma === true);
  check("gradoRasguno persistido", stored?.gradoRasguno === 2);
  check("pigmentacion persistido", stored?.pigmentacion === 5);

  console.log("5. numeroAve máximo en servidor después de registrar (debe ser 1)");
  const maxAfterRes = await fetch(
    `${BASE_URL}/api/mobile/numero-ave-max?plantelId=${plantel.id}&campania=${TEST_CAMPANIA}&galpon=G-E2E&corral=1&categoria=MACHO`,
    { headers: { authorization: `Bearer ${token}` } }
  );
  const { maxNumeroAve: maxAfter } = await maxAfterRes.json();
  check("maxNumeroAve refleja el ave recién registrada", maxAfter === 1);

  console.log("6. Reintento de sync (mismo id, peso distinto) debe ser no-op");
  const retryBody = { registros: [{ ...registroBody.registros[0], pesoGramos: 9999 }] };
  const retryRes = await fetch(`${BASE_URL}/api/mobile/registros`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(retryBody),
  });
  check("reintento responde 200", retryRes.status === 200);
  const afterRetry = await prisma.registroPesoPreventa.findUnique({ where: { id: registroId } });
  check("el reintento NO sobrescribió pesoGramos (idempotente)", afterRetry?.pesoGramos === 2500);

  console.log("7. Peso en vivo");
  const liveRes = await fetch(`${BASE_URL}/api/mobile/live-weight`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      pesoGramos: 2600,
      plantelCodigo: plantel.codigo,
      campania: TEST_CAMPANIA,
      galpon: "G-E2E",
      corral: "1",
      categoria: "MACHO",
    }),
  });
  check("live-weight responde 200", liveRes.status === 200);
  const liveStored = await prisma.liveWeightReading.findUnique({ where: { verificadorId: user.id } });
  check("live-weight persistido", liveStored?.pesoGramos === 2600);

  console.log("8. Revocación de token (simula admin) -> 401 inmediato");
  await prisma.user.update({ where: { id: user.id }, data: { apiToken: null } });
  const afterRevokeRes = await fetch(`${BASE_URL}/api/mobile/catalogos`, {
    headers: { authorization: `Bearer ${token}` },
  });
  check("token revocado responde 401", afterRevokeRes.status === 401);

  console.log("9. Re-login emite un token nuevo");
  const reloginRes = await fetch(`${BASE_URL}/api/mobile/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  check("re-login responde 200", reloginRes.status === 200);
  const { token: newToken } = await reloginRes.json();
  check("el token nuevo es distinto del revocado", newToken !== token);

  console.log(`\n${passed} checks OK`);
}

main()
  .catch((err) => {
    console.error("\nFALLÓ:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.registroPesoPreventa.deleteMany({ where: { campania: TEST_CAMPANIA } });
    await prisma.$disconnect();
  });

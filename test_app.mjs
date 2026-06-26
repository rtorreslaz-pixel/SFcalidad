import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

async function shot(name) {
  await page.screenshot({ path: `/tmp/screenshots/${name}.png`, fullPage: true });
}

// Login as supervisor
await page.goto("http://localhost:3000/login");
await page.fill('input[name="email"]', "supervisor@avicola.com");
await page.fill('input[name="password"]', "demo1234");
await shot("01-login");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await shot("02-dashboard-empty");

// Go to new inspection
await page.goto("http://localhost:3000/inspecciones/nueva");
await page.waitForSelector('select[name="clienteId"]');
await shot("03-nueva-inspeccion");

// Fill the form - Cliente and Plantel are independent selections
await page.selectOption('select[name="clienteId"]', { label: "AKIM" });
const plantelLabels = await page.locator('#planteles-list option').evaluateAll((opts) =>
  opts.map((o) => o.getAttribute("value"))
);
console.log("plantel options:", plantelLabels.length);
const plantelLabel = plantelLabels.find((v) => v && v.includes("P006"));
await page.fill('input[list="planteles-list"]', plantelLabel);
await page.fill('input[name="galpon"]', "11A");
await page.selectOption('select[name="sexo"]', "MACHO");
await page.fill('input[name="cantidad"]', "1800");

// Fill a couple of defect inputs
const defectInputs = await page.locator('input[name$="_unidades"]').all();
console.log("defect inputs:", defectInputs.length);
await defectInputs[0].fill("3");
const kgInputs = await page.locator('input[name$="_kg"]').all();
await kgInputs[0].fill("4.5");

// Jabas
await page.fill('input[name="jabas"]', "20");

// Almohadillas y Rasguños counters
await page.getByLabel("Sumar Sin lesión").first().click();
await page.getByLabel("Sumar Sin lesión").first().click();
await page.getByLabel("Sumar Leve").first().click();

await page.fill('textarea[name="observaciones"]', "Inspección de prueba automatizada.");
await shot("04-form-filled");

await page.click('button:has-text("Guardar inspección")');
await page.waitForURL("**/inspecciones/**", { timeout: 15000 });
await shot("05-detalle-inspeccion");

// List page
await page.goto("http://localhost:3000/inspecciones");
await page.waitForSelector("table");
await shot("06-lista-inspecciones");

// Dashboard with data
await page.goto("http://localhost:3000/dashboard");
await page.waitForTimeout(800);
await shot("07-dashboard-con-datos");

// Admin pages
await page.goto("http://localhost:3000/admin");
await shot("08-admin");
await page.goto("http://localhost:3000/admin/clientes");
await shot("09-admin-clientes");
await page.goto("http://localhost:3000/admin/usuarios");
await shot("10-admin-usuarios");
await page.goto("http://localhost:3000/admin/defectos");
await shot("11-admin-defectos");

// Logout and login as verificador
await page.goto("http://localhost:3000/dashboard");
await page.click('button:has-text("Salir")');
await page.waitForURL("**/login");

await page.fill('input[name="email"]', "verificador1@avicola.com");
await page.fill('input[name="password"]', "demo1234");
await page.click('button[type="submit"]');
await page.waitForURL("**/inspecciones/nueva");
await shot("12-verificador-nueva-inspeccion");

// Verificador should be redirected away from dashboard and inspecciones list
await page.goto("http://localhost:3000/dashboard");
await page.waitForURL("**/inspecciones/nueva");
console.log("verificador dashboard url:", page.url());

await page.goto("http://localhost:3000/inspecciones");
await page.waitForURL("**/inspecciones/nueva");
console.log("verificador inspecciones url:", page.url());
await shot("13-verificador-inspecciones-redirect");

// Try admin access as verificador (should redirect)
await page.goto("http://localhost:3000/admin");
await page.waitForTimeout(500);
console.log("verificador admin url:", page.url());
await shot("14-verificador-admin-redirect");

// Logout and login as jefe
await page.goto("http://localhost:3000/inspecciones/nueva");
await page.click('button:has-text("Salir")');
await page.waitForURL("**/login");

await page.fill('input[name="email"]', "jefe@avicola.com");
await page.fill('input[name="password"]', "demo1234");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await shot("15-jefe-dashboard");

// Jefe should be redirected away from inspecciones and nueva inspección
await page.goto("http://localhost:3000/inspecciones");
await page.waitForURL("**/dashboard");
console.log("jefe inspecciones url:", page.url());

await page.goto("http://localhost:3000/inspecciones/nueva");
await page.waitForURL("**/dashboard");
console.log("jefe nueva inspeccion url:", page.url());
await shot("16-jefe-nueva-redirect");

console.log("CONSOLE/PAGE ERRORS:", JSON.stringify(errors, null, 2));

await browser.close();

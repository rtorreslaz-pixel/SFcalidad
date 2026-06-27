import { Prisma } from "@/generated/prisma/client";

// Include para los formatos clasificados (réplica digital de los formularios en papel).
// Añade hematomaDetalles y saldos respecto al include del reporte gerencial.
export const JORNADA_FORMATO_INCLUDE = {
  cliente: true,
  verificador: { select: { nombre: true } },
  saldos: true,
  inspecciones: {
    where: { estado: "COMPLETA" },
    orderBy: { createdAt: "asc" },
    include: {
      plantel: { select: { codigo: true } },
      defectos: { include: { tipoDefecto: true } },
      evaluacionesLesion: true,
      hematomaDetalles: true,
    },
  },
} satisfies Prisma.JornadaInclude;

export type JornadaFormato = Prisma.JornadaGetPayload<{ include: typeof JORNADA_FORMATO_INCLUDE }>;
type InspeccionFormato = JornadaFormato["inspecciones"][number];

// ─── Helpers de formato ───────────────────────────────────────────────
// Celdas en blanco cuando no hay dato, igual que el formato a lapicero.
function num(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}
function cnt(v: number | null | undefined): string {
  return !v ? "" : String(v);
}
function kg(v: number | null | undefined): string {
  return !v ? "" : v.toFixed(2);
}
function fechaCorta(f: Date): string {
  return f.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const CB = "border border-black";
const CELL = `${CB} px-1 py-[2px] align-middle`;
const LABEL = `${CELL} font-semibold`;
const DATA = `${CELL} text-center`;

// ─── FICYB002 · Almohadillas y rasguños (una página, ambos sexos) ──────

const LESION_CATS = [
  { key: "ALMOHADILLAS", label: "ALMOHADILLAS" },
  { key: "RASGUNOS", label: "RASGUÑOS" },
] as const;
const SEXOS = ["MACHO", "HEMBRA"] as const;

function inspeccionPorSexo(jornada: JornadaFormato, sexo: "MACHO" | "HEMBRA") {
  return jornada.inspecciones.find((i) => i.sexo === sexo) ?? null;
}

function lesionAgregada(
  jornada: JornadaFormato,
  categoria: "ALMOHADILLAS" | "RASGUNOS",
  sexo: "MACHO" | "HEMBRA",
) {
  const acc = { muestra: 0, sinLesion: 0, leve: 0, grave: 0 };
  let hay = false;
  for (const insp of jornada.inspecciones) {
    for (const ev of insp.evaluacionesLesion) {
      if (ev.categoria === categoria && ev.sexo === sexo) {
        acc.muestra += ev.muestra;
        acc.sinLesion += ev.sinLesion;
        acc.leve += ev.leve;
        acc.grave += ev.grave;
        hay = true;
      }
    }
  }
  return hay ? acc : null;
}

export function FormatoAlmohadillas({ jornada }: { jornada: JornadaFormato }) {
  return (
    <div className="formato-hoja mx-auto bg-white p-4 text-[11px] text-black">
      <table className="w-full border-collapse">
        <tbody>
          {/* Cabecera con código */}
          <tr>
            <td className={`${LABEL} w-[18%] text-center`} rowSpan={2}>
              SAN FERNANDO
              <br />
              CALIDAD AAVV
            </td>
            <td className={`${CELL} text-center text-[13px] font-bold`} colSpan={8} rowSpan={2}>
              EVALUACIÓN DE ALMOHADILLAS Y RASGUÑOS
              <br />
              EN POLLO BENEFICIADO
            </td>
            <td className={`${CELL} text-center`} colSpan={2}>CÓDIGO: FICYB002</td>
          </tr>
          <tr>
            <td className={`${CELL} text-center`} colSpan={2}>VERSIÓN: 01</td>
          </tr>

          {/* Datos de beneficiado */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={11}>DATOS DE BENEFICIADO</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={5}>DISTRIBUIDOR: {jornada.cliente.nombre}</td>
            <td className={LABEL} colSpan={3}>FECHA: {fechaCorta(jornada.fecha)}</td>
            <td className={LABEL} colSpan={3}>VERIFICADOR: {jornada.verificador.nombre}</td>
          </tr>
          {SEXOS.map((sexo) => {
            const insp = inspeccionPorSexo(jornada, sexo);
            return (
              <tr key={sexo}>
                <td className={LABEL}>{sexo}</td>
                <td className={LABEL} colSpan={2}>PLANTEL: {insp?.plantel?.codigo ?? ""}</td>
                <td className={LABEL} colSpan={2}>GALPÓN: {insp?.galpon ?? ""}</td>
                <td className={LABEL} colSpan={3}>JABAS: {num(insp?.jabas)}</td>
                <td className={LABEL} colSpan={3}>UNIDADES: {insp ? cnt(insp.cantidad) : ""}</td>
              </tr>
            );
          })}

          {/* Evaluaciones de calidad */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={11}>EVALUACIONES DE CALIDAD</td>
          </tr>
          {LESION_CATS.map((cat) => (
            <FilasLesion key={cat.key} jornada={jornada} categoria={cat.key} label={cat.label} />
          ))}
        </tbody>
      </table>

      <p className="mt-2 text-[9px]">
        Referencia: IICYB007 Instructivo de evaluación de almohadillas plantares y rasguños en pollos.
      </p>
    </div>
  );
}

function FilasLesion({
  jornada,
  categoria,
  label,
}: {
  jornada: JornadaFormato;
  categoria: "ALMOHADILLAS" | "RASGUNOS";
  label: string;
}) {
  return (
    <>
      {SEXOS.map((sexo, idx) => {
        const data = lesionAgregada(jornada, categoria, sexo);
        return (
          <tr key={sexo}>
            {idx === 0 && (
              <td className={`${LABEL} text-center`} rowSpan={2}>{label}</td>
            )}
            <td className={LABEL}>{sexo}</td>
            <td className={LABEL} colSpan={2}>MUESTRA:</td>
            <td className={DATA}>{data ? cnt(data.muestra) : ""}</td>
            <td className={LABEL} colSpan={2}>SIN LESIÓN:</td>
            <td className={DATA}>{data ? cnt(data.sinLesion) : ""}</td>
            <td className={LABEL}>LEVE:</td>
            <td className={DATA}>{data ? cnt(data.leve) : ""}</td>
            <td className={LABEL}>
              SEVERO: <span className="font-normal">{data ? cnt(data.grave) : ""}</span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ─── FQAVV027 · Verificación de pollo selección (una página por inspección) ─

const SELECCION_COLS: { label: string; defecto: string }[][] = [
  [
    { label: "DESHIDRATADOS", defecto: "Deshidratado" },
    { label: "MIOPATÍA PECTORAL", defecto: "Mío Pectoral" },
    { label: "MIOPATÍA DORSAL", defecto: "Mío Dorsal" },
    { label: "CELULÍTIS ABDOMINAL", defecto: "Celulitis Abdominal" },
    { label: "ALIMENTO EN BUCHE", defecto: "Alimento en Buche" },
    { label: "PECHUGA MADERA", defecto: "Pechuga Madera" },
  ],
  [
    { label: "GOLPE EN ALA O ESPINAZO", defecto: "Golpeados Alas/Espalda" },
    { label: "GOLPE EN PECHUGA", defecto: "Golpes Pechuga" },
    { label: "GOLPE EN PIERNA", defecto: "Golpes Pierna" },
    { label: "MENOR PESO", defecto: "Menor Peso" },
    { label: "ÚLCERAS", defecto: "Úlceras" },
    { label: "RASGUÑADOS", defecto: "Rasguñados" },
  ],
];

const MUTILADOS_ROWS = [
  { label: "ALAS", defectos: ["Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota"] },
  { label: "PIERNAS", defectos: ["Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota"] },
] as const;

const HEMATOMA_UBIC = ["ALA", "ESPINAZO", "PECHUGA", "PIERNA"] as const;
const HEMATOMA_GRADOS = ["GRADO1", "GRADO2", "GRADO3"] as const;

function defectosMap(insp: InspeccionFormato) {
  const m = new Map<string, { unidades: number; kg: number }>();
  for (const d of insp.defectos) m.set(d.tipoDefecto.nombre, { unidades: d.unidades, kg: d.kg });
  return m;
}

function hematomasMap(insp: InspeccionFormato) {
  const m = new Map<string, number>();
  for (const h of insp.hematomaDetalles) m.set(`${h.ubicacion}-${h.grado}`, h.cantidad);
  return m;
}

export function FormatoSeleccion({
  jornada,
  inspeccion,
}: {
  jornada: JornadaFormato;
  inspeccion: InspeccionFormato;
}) {
  const dm = defectosMap(inspeccion);
  const hm = hematomasMap(inspeccion);
  const saldo = inspeccion.sexo ? jornada.saldos.find((s) => s.sexo === inspeccion.sexo) : null;
  const muestra =
    inspeccion.hematomasCon != null || inspeccion.hematomasSin != null
      ? (inspeccion.hematomasCon ?? 0) + (inspeccion.hematomasSin ?? 0)
      : null;
  const pig = [
    inspeccion.pigNivel0, inspeccion.pigNivel1, inspeccion.pigNivel2, inspeccion.pigNivel3,
    inspeccion.pigNivel4, inspeccion.pigNivel5, inspeccion.pigNivel6, inspeccion.pigNivel7,
  ];

  return (
    <div className="formato-hoja mx-auto bg-white p-4 text-[11px] text-black">
      <table className="w-full border-collapse">
        <tbody>
          {/* Cabecera */}
          <tr>
            <td className={`${LABEL} w-[16%] text-center`} rowSpan={2}>
              SAN FERNANDO
              <br />
              CALIDAD AAVV
            </td>
            <td className={`${CELL} text-center text-[13px] font-bold`} colSpan={7} rowSpan={2}>
              VERIFICACIÓN DE POLLO SELECCIÓN BENEFICIADO
            </td>
            <td className={`${CELL} text-center`} colSpan={2}>CÓDIGO: FQAVV027</td>
          </tr>
          <tr>
            <td className={`${CELL} text-center`} colSpan={2}>VERSIÓN: 01</td>
          </tr>

          {/* Datos de beneficiado */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>DATOS DE BENEFICIADO</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={6}>DISTRIBUIDOR: {jornada.cliente.nombre}</td>
            <td className={LABEL} colSpan={2}>FECHA: {fechaCorta(jornada.fecha)}</td>
            <td className={LABEL} colSpan={2}>SEXO: {inspeccion.sexo ?? ""}</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={3}>PLANTEL: {inspeccion.plantel?.codigo ?? ""}</td>
            <td className={LABEL} colSpan={3}>GALPÓN: {inspeccion.galpon ?? ""}</td>
            <td className={LABEL} colSpan={2}>JABAS: {num(inspeccion.jabas)}</td>
            <td className={LABEL} colSpan={2}>UNIDADES: {cnt(inspeccion.cantidad)}</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={3}>PROM VIVO: {num(inspeccion.promVivo)}</td>
            <td className={LABEL} colSpan={3}>PROM BENEFICIADO: {num(inspeccion.promBeneficiado)}</td>
            <td className={LABEL} colSpan={4}>COMPLEX: {inspeccion.complex ?? ""}</td>
          </tr>

          {/* Temperaturas */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>DATOS DE TEMPERATURAS</td>
          </tr>
          <tr>
            <td className={`${LABEL} text-center`} colSpan={3}>VEHÍCULO CON JABAS</td>
            <td className={`${LABEL} text-center`} colSpan={3}>PLATAFORMA SIN JABAS</td>
            <td className={`${LABEL} text-center`} colSpan={4}>PLATAFORMA CON JABAS</td>
          </tr>
          <tr>
            <td className={DATA} colSpan={3}>{num(inspeccion.tempCamion)}</td>
            <td className={DATA} colSpan={3}>{num(inspeccion.tempAves)}</td>
            <td className={DATA} colSpan={4}>{num(inspeccion.tempPlataforma)}</td>
          </tr>

          {/* Hematomas */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>EVALUACIÓN DE HEMATOMAS</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={2}>MUESTRA: {cnt(muestra)}</td>
            <td className={LABEL} colSpan={3}># HEMATOMAS: {num(inspeccion.hematomasCon)}</td>
            <td className={LABEL} colSpan={3}># SIN HEMATOMAS: {num(inspeccion.hematomasSin)}</td>
            <td className={LABEL} colSpan={2}>DÍAS DE SACA:</td>
          </tr>
          <tr>
            <td className={`${LABEL} text-center`}>UBICACIÓN</td>
            <td className={`${LABEL} text-center`} colSpan={3}>1er Grado</td>
            <td className={`${LABEL} text-center`} colSpan={3}>2do Grado</td>
            <td className={`${LABEL} text-center`} colSpan={3}>3er Grado</td>
          </tr>
          {HEMATOMA_UBIC.map((ub) => (
            <tr key={ub}>
              <td className={LABEL}>{ub}</td>
              {HEMATOMA_GRADOS.map((g) => (
                <td key={g} className={DATA} colSpan={3}>{cnt(hm.get(`${ub}-${g}`))}</td>
              ))}
            </tr>
          ))}

          {/* Mutilados */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>EVALUACIÓN DE MUTILADOS</td>
          </tr>
          <tr>
            <td className={`${LABEL} text-center`} colSpan={2}>MIEMBROS</td>
            <td className={`${LABEL} text-center`}>1°</td>
            <td className={`${LABEL} text-center`}>Kg</td>
            <td className={`${LABEL} text-center`}>2°</td>
            <td className={`${LABEL} text-center`}>Kg</td>
            <td className={`${LABEL} text-center`}>3°</td>
            <td className={`${LABEL} text-center`}>Kg</td>
            <td className={`${LABEL} text-center`}>ROTAS</td>
            <td className={`${LABEL} text-center`}>Kg</td>
          </tr>
          {MUTILADOS_ROWS.map((row) => (
            <tr key={row.label}>
              <td className={LABEL} colSpan={2}>{row.label}</td>
              {row.defectos.map((nombre) => {
                const d = dm.get(nombre);
                return (
                  <FragmentCell key={nombre} unidades={d?.unidades} kgVal={d?.kg} />
                );
              })}
            </tr>
          ))}

          {/* Evaluaciones de pollo selección */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>EVALUACIONES DE POLLO SELECCIÓN</td>
          </tr>
          <tr>
            <td className={`${LABEL} text-center`} colSpan={3}>MOTIVO</td>
            <td className={`${LABEL} text-center`}>UNIDADES</td>
            <td className={`${LABEL} text-center`}>KILOS</td>
            <td className={`${LABEL} text-center`} colSpan={3}>MOTIVO</td>
            <td className={`${LABEL} text-center`}>UNIDADES</td>
            <td className={`${LABEL} text-center`}>KILOS</td>
          </tr>
          {SELECCION_COLS[0].map((izq, i) => {
            const der = SELECCION_COLS[1][i];
            const di = dm.get(izq.defecto);
            const dd = dm.get(der.defecto);
            return (
              <tr key={izq.label}>
                <td className={LABEL} colSpan={3}>{izq.label}</td>
                <td className={DATA}>{cnt(di?.unidades)}</td>
                <td className={DATA}>{kg(di?.kg)}</td>
                <td className={LABEL} colSpan={3}>{der.label}</td>
                <td className={DATA}>{cnt(dd?.unidades)}</td>
                <td className={DATA}>{kg(dd?.kg)}</td>
              </tr>
            );
          })}

          {/* Saldo */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>EVALUACIONES DE POLLO SALDO</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={2}>CANTIDAD JB</td>
            <td className={DATA}>{cnt(saldo?.jabas)}</td>
            <td className={LABEL}>UNID</td>
            <td className={DATA}>{cnt(saldo?.unidades)}</td>
            <td className={LABEL} colSpan={2}>CANT. SELECCIÓN</td>
            <td className={DATA}>{cnt(saldo?.unidadesSeleccion)}</td>
            <td className={LABEL}>KG SEL.</td>
            <td className={DATA}>{kg(saldo?.kgSeleccion)}</td>
          </tr>

          {/* Observaciones / pigmentación */}
          <tr>
            <td className={`${LABEL} text-center`} colSpan={10}>OBSERVACIONES DE BENEFICIADO</td>
          </tr>
          <tr>
            <td className={LABEL} colSpan={2}>PIGMENTACIÓN</td>
            {pig.map((c, nivel) => (
              <td key={nivel} className={DATA}>
                <span className="block text-[9px] text-slate-500">{nivel}</span>
                {cnt(c)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FragmentCell({ unidades, kgVal }: { unidades?: number; kgVal?: number }) {
  return (
    <>
      <td className={DATA}>{cnt(unidades)}</td>
      <td className={DATA}>{kg(kgVal)}</td>
    </>
  );
}

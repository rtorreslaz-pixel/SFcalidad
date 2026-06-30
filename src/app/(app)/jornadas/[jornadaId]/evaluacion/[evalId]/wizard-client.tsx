"use client";

import { useState, useTransition, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  autoguardadoAction,
  avanzarPasoAction,
  completarEvaluacionAction,
  uploadFotoAction,
} from "./wizard-actions";

// ---- Types ----
type SexoAve = "MACHO" | "HEMBRA";

type Plantel = { id: string; codigo: string; nombre: string | null; subZona: string | null; zona: string | null };
type TipoDefecto = { id: string; nombre: string; categoria: string | null; orden: number; principal: boolean };
type EvaluacionLesion = { id: string; categoria: string; sexo: string; sinLesion: number; leve: number; grave: number; muestra: number };
type DefectoRegistro = { id: string; tipoDefectoId: string; unidades: number; kg: number; tipoDefecto: TipoDefecto };
type HematomaDetalle = { id: string; grado: string; ubicacion: string; cantidad: number };
type Foto = { id: string; path: string };

type Inspeccion = {
  id: string;
  pasoActual: number;
  estado: string;
  sexo: SexoAve | null;
  plantelId: string | null;
  campania: string | null;
  galpon: string | null;
  corral: string | null;
  jabas: number | null;
  cantidad: number;
  promVivo: number | null;
  promBeneficiado: number | null;
  nroGuia: string | null;
  complex: string | null;
  tempPlataforma: number | null;
  tempPlataformaVacia: number | null;
  tempCamion: number | null;
  densidad: number | null;
  hematomasCon: number | null;
  hematomasSin: number | null;
  hematomaDetalles: HematomaDetalle[];
  pigNivel0: number; pigNivel1: number; pigNivel2: number; pigNivel3: number;
  pigNivel4: number; pigNivel5: number; pigNivel6: number; pigNivel7: number;
  mermaAlaKg: number | null;
  mermaPiernaKg: number | null;
  observaciones: string | null;
  evaluacionesLesion: EvaluacionLesion[];
  defectos: DefectoRegistro[];
  fotos: Foto[];
  jornada: { id: string; cliente: { nombre: string } } | null;
};

// ---- Constants ----
const SF_BLUE = "#0b4ea2";

const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
];

const GRADOS_HEMATOMA = [
  { key: "GRADO1", label: "1er grado" },
  { key: "GRADO2", label: "2do grado" },
  { key: "GRADO3", label: "3er grado" },
] as const;

const UBICACIONES_HEMATOMA = [
  { key: "ALA", label: "Ala" },
  { key: "ESPINAZO", label: "Espin." },
  { key: "PECHUGA", label: "Pech." },
  { key: "PIERNA", label: "Pierna" },
] as const;

const PASO_LABELS = [
  "Datos del camión",
  "Temperaturas",
  "Almohadillas y Rasguños",
  "Hematomas",
  "Pigmentación",
  "Selección",
  "Merma y cierre",
];

const SEXO_ABREV: Record<SexoAve, string> = { MACHO: "M", HEMBRA: "H" };

function buildComplexEntity(parts: {
  plantelCodigo: string | null;
  campania: string;
  galpon: string;
  sexo: SexoAve | null;
  corral: string;
}): string {
  const { plantelCodigo, campania, galpon, sexo, corral } = parts;
  const sexoAbrev = sexo ? SEXO_ABREV[sexo] : "";
  const piezas = [plantelCodigo ?? "", campania, galpon, sexoAbrev, corral];
  if (piezas.every((p) => !p)) return "";
  return piezas.join("-");
}

// ---- Design components ----
function BigInput({ label, type = "number", value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-500">
        {label}
      </span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-[14px] text-base font-bold text-slate-900 focus:outline-none"
        style={{ fontSize: 16 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = SF_BLUE; e.currentTarget.style.boxShadow = `0 0 0 1px ${SF_BLUE}`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
      />
    </label>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-[14px] py-3">
      <span className="flex-1 text-[15px] font-semibold leading-snug text-slate-700">{label}</span>
      <div className="flex flex-none items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-[12px] border border-slate-300 bg-white text-xl font-bold text-slate-700"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-[60px] rounded-[10px] border border-slate-200 bg-white py-2 text-center font-mono text-2xl font-extrabold text-slate-900"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-[12px] border text-xl font-bold"
          style={{ background: "#eff6ff", borderColor: SF_BLUE, color: SF_BLUE }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function DefectoCard({ nombre, tipoId, defectos, updateDefecto, onRemove }: {
  nombre: string;
  tipoId: string;
  defectos: Record<string, { unidades: number; kg: number }>;
  updateDefecto: (id: string, field: "unidades" | "kg", value: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-[14px]">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[15px] font-bold text-slate-800">{nombre}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-slate-400 hover:text-red-500">✕</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Unidades</span>
          <input
            type="number" min={0}
            value={defectos[tipoId]?.unidades || ""}
            onChange={(e) => updateDefecto(tipoId, "unidades", Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-[9px] text-center font-mono text-base"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Kg</span>
          <input
            type="number" min={0} step="0.01"
            value={defectos[tipoId]?.kg || ""}
            onChange={(e) => updateDefecto(tipoId, "kg", Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-[9px] text-center font-mono text-base"
          />
        </label>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function WizardClient({
  inspeccion: initial,
  jornadaId,
  planteles,
  tiposDefecto,
  userId,
}: {
  inspeccion: Inspeccion;
  jornadaId: string;
  planteles: Plantel[];
  tiposDefecto: TipoDefecto[];
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingPatchRef = useRef<Record<string, unknown>>({});

  const [paso, setPaso] = useState(initial.pasoActual);
  const [completed, setCompleted] = useState(initial.estado === "COMPLETA");

  // Step 1 state
  const [sexo, setSexo] = useState<SexoAve | null>(initial.sexo);
  const [plantelId, setPlantelId] = useState(initial.plantelId ?? "");
  const [plantelQuery, setPlantelQuery] = useState(() => {
    const p = planteles.find((p) => p.id === initial.plantelId);
    return p ? `${p.codigo}${p.subZona ? ` · ${p.subZona}` : ""}` : "";
  });
  const [campania, setCampania] = useState(initial.campania ?? "");
  const [galpon, setGalpon] = useState(initial.galpon ?? "");
  const [corral, setCorral] = useState(initial.corral ?? "");
  const [jabas, setJabas] = useState(String(initial.jabas ?? ""));
  const [cantidad, setCantidad] = useState(String(initial.cantidad || ""));
  const [promVivo, setPromVivo] = useState(String(initial.promVivo ?? ""));
  const [promBeneficiado, setPromBeneficiado] = useState(String(initial.promBeneficiado ?? ""));
  const [nroGuia, setNroGuia] = useState(initial.nroGuia ?? "");
  const [complex, setComplex] = useState(initial.complex ?? "");

  const recomputeComplex = useCallback(
    (overrides: { plantelId?: string; campania?: string; galpon?: string; sexo?: SexoAve | null; corral?: string }) => {
      const plantelIdNext = overrides.plantelId ?? plantelId;
      const plantelCodigo = planteles.find((p) => p.id === plantelIdNext)?.codigo ?? null;
      return buildComplexEntity({
        plantelCodigo,
        campania: overrides.campania ?? campania,
        galpon: overrides.galpon ?? galpon,
        sexo: overrides.sexo ?? sexo,
        corral: overrides.corral ?? corral,
      });
    },
    [plantelId, campania, galpon, sexo, corral, planteles]
  );

  // Step 2 state
  const [tempCamion, setTempCamion] = useState(String(initial.tempCamion ?? ""));
  const [tempPlataformaVacia, setTempPlataformaVacia] = useState(String(initial.tempPlataformaVacia ?? ""));
  const [tempPlataforma, setTempPlataforma] = useState(String(initial.tempPlataforma ?? ""));
  const [densidad, setDensidad] = useState(String(initial.densidad ?? ""));

  // Step 3 state
  type LesionKey = "ALMOHADILLAS" | "RASGUNOS";
  const getLesion = (cat: LesionKey) => {
    const ev = initial.evaluacionesLesion.find((e) => e.categoria === cat);
    return ev ? { sinLesion: ev.sinLesion, leve: ev.leve, grave: ev.grave } : { sinLesion: 0, leve: 0, grave: 0 };
  };
  const [alm, setAlm] = useState(getLesion("ALMOHADILLAS"));
  const [ras, setRas] = useState(getLesion("RASGUNOS"));

  // Step 4 state
  const [hemCon, setHemCon] = useState(initial.hematomasCon ?? 0);
  const [hemSin, setHemSin] = useState(initial.hematomasSin ?? 0);
  const [hemDetalle, setHemDetalle] = useState<Record<string, number>>(() => {
    const vals: Record<string, number> = {};
    initial.hematomaDetalles.forEach((d) => { vals[`${d.grado}_${d.ubicacion}`] = d.cantidad; });
    return vals;
  });

  // Step 5 state
  const [pig, setPig] = useState([
    initial.pigNivel0, initial.pigNivel1, initial.pigNivel2, initial.pigNivel3,
    initial.pigNivel4, initial.pigNivel5, initial.pigNivel6, initial.pigNivel7,
  ]);

  // Step 6 state
  type DefectoVals = Record<string, { unidades: number; kg: number }>;
  const [defectos, setDefectos] = useState<DefectoVals>(() => {
    const vals: DefectoVals = {};
    initial.defectos.forEach((d) => { vals[d.tipoDefectoId] = { unidades: d.unidades, kg: d.kg }; });
    return vals;
  });
  const [extraIds, setExtraIds] = useState<string[]>(() =>
    initial.defectos
      .filter((d) => {
        const tipo = tiposDefecto.find((t) => t.id === d.tipoDefectoId);
        return tipo && !tipo.principal && !NOMBRES_MERMA_PASO7.includes(tipo.nombre);
      })
      .map((d) => d.tipoDefectoId)
  );

  // Step 7 state
  const [observaciones, setObservaciones] = useState(initial.observaciones ?? "");

  // Photos
  const [fotos, setFotos] = useState<Foto[]>(initial.fotos);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [cameraKey, setCameraKey] = useState(0);

  // Autoguardado
  const scheduleGuardado = useCallback((patch: Record<string, unknown>) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    clearTimeout(timerRef.current);
    setSaveStatus("saving");
    timerRef.current = setTimeout(() => {
      const patchToSave = pendingPatchRef.current;
      pendingPatchRef.current = {};
      startTransition(async () => {
        try {
          await autoguardadoAction(initial.id, patchToSave);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1800);
        } catch {
          setSaveStatus("error");
        }
      });
    }, 700);
  }, [initial.id]);

  // Defect helpers
  const principales = useMemo(() => tiposDefecto.filter((t) => t.principal).sort((a, b) => a.orden - b.orden), [tiposDefecto]);
  const tiposMerma = useMemo(() => tiposDefecto.filter((t) => NOMBRES_MERMA_PASO7.includes(t.nombre)).sort((a, b) => a.orden - b.orden), [tiposDefecto]);
  const catalogoAdicional = useMemo(() => tiposDefecto.filter((t) => !t.principal && !NOMBRES_MERMA_PASO7.includes(t.nombre)).sort((a, b) => a.orden - b.orden), [tiposDefecto]);
  const extraTipos = useMemo(() => extraIds.map((id) => tiposDefecto.find((t) => t.id === id)).filter(Boolean) as TipoDefecto[], [extraIds, tiposDefecto]);
  const disponibles = useMemo(() => catalogoAdicional.filter((t) => !extraIds.includes(t.id)), [catalogoAdicional, extraIds]);

  function updateDefecto(id: string, field: "unidades" | "kg", value: number) {
    const next = { ...defectos, [id]: { unidades: defectos[id]?.unidades ?? 0, kg: defectos[id]?.kg ?? 0, [field]: value } };
    setDefectos(next);
    scheduleGuardado({ defectos: Object.entries(next).map(([tipoDefectoId, v]) => ({ tipoDefectoId, ...v })) });
  }

  function updateHematomaDetalle(grado: string, ubicacion: string, value: number) {
    const next = { ...hemDetalle, [`${grado}_${ubicacion}`]: value };
    setHemDetalle(next);
    scheduleGuardado({
      hematomaDetalles: Object.entries(next).map(([key, cantidad]) => {
        const [g, u] = key.split("_");
        return { grado: g, ubicacion: u, cantidad };
      }),
    });
  }

  async function handlePhotoCapture(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    fd.append("evalId", initial.id);
    Array.from(files).slice(0, 5 - fotos.length).forEach((f) => fd.append("fotos", f));
    startTransition(async () => {
      const result = await uploadFotoAction(fd);
      if (result?.fotos) setFotos((prev) => [...prev, ...result.fotos]);
      setCameraKey((k) => k + 1);
    });
  }

  async function handleNext() {
    const nextPaso = paso + 1;
    await avanzarPasoAction(initial.id, nextPaso);
    setPaso(nextPaso);
    window.scrollTo(0, 0);
  }

  async function handleBack() {
    const prevPaso = paso - 1;
    await avanzarPasoAction(initial.id, prevPaso);
    setPaso(prevPaso);
    window.scrollTo(0, 0);
  }

  async function handleCompletar() {
    await completarEvaluacionAction(initial.id, jornadaId);
    setCompleted(true);
  }

  const plantelLabel = (p: Plantel) => `${p.codigo}${p.subZona ? ` · ${p.subZona}` : ""}${p.zona ? ` (${p.zona})` : ""}`;

  // ---- Step renderers ----
  function renderStep() {
    switch (paso) {
      case 1:
        return (
          <div className="space-y-[14px]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-500">Plantel</span>
              <input
                type="text"
                list="planteles-list"
                value={plantelQuery}
                onChange={(e) => {
                  setPlantelQuery(e.target.value);
                  const match = planteles.find((p) => plantelLabel(p) === e.target.value);
                  const id = match ? match.id : "";
                  setPlantelId(id);
                  const nextComplex = recomputeComplex({ plantelId: id });
                  setComplex(nextComplex);
                  scheduleGuardado({ plantelId: id || null, complex: nextComplex || null });
                }}
                placeholder="Busca por código..."
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-[14px] text-base font-bold text-slate-900 focus:outline-none"
                style={{ fontSize: 16 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = SF_BLUE; e.currentTarget.style.boxShadow = `0 0 0 1px ${SF_BLUE}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
              />
              <datalist id="planteles-list">
                {planteles.map((p) => <option key={p.id} value={plantelLabel(p)} />)}
              </datalist>
            </label>

            <BigInput label="Campaña" type="text" value={campania} onChange={(v) => {
              setCampania(v);
              const nextComplex = recomputeComplex({ campania: v });
              setComplex(nextComplex);
              scheduleGuardado({ campania: v || null, complex: nextComplex || null });
            }} placeholder="Ej. 2401" />

            <BigInput label="Galpón" type="text" value={galpon} onChange={(v) => {
              setGalpon(v);
              const nextComplex = recomputeComplex({ galpon: v });
              setComplex(nextComplex);
              scheduleGuardado({ galpon: v || null, complex: nextComplex || null });
            }} placeholder="Ej. 11" />

            {/* Sexo selector */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-500">Sexo <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-3">
                {(["MACHO", "HEMBRA"] as const).map((s) => {
                  const selected = sexo === s;
                  const style = selected
                    ? s === "MACHO"
                      ? { background: "#dbeafe", border: "2px solid #2563eb", color: "#2563eb" }
                      : { background: "#fce7f3", border: "2px solid #db2777", color: "#db2777" }
                    : { background: "transparent", border: "2px solid #e2e8f0", color: "#94a3b8" };
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSexo(s);
                        const nextComplex = recomputeComplex({ sexo: s });
                        setComplex(nextComplex);
                        scheduleGuardado({ sexo: s, complex: nextComplex || null });
                      }}
                      className="h-[68px] rounded-[16px] text-lg font-extrabold"
                      style={style}
                    >
                      {s === "MACHO" ? "♂ Macho" : "♀ Hembra"}
                    </button>
                  );
                })}
              </div>
            </div>

            <BigInput label="Corral" type="text" value={corral} onChange={(v) => {
              setCorral(v);
              const nextComplex = recomputeComplex({ corral: v });
              setComplex(nextComplex);
              scheduleGuardado({ corral: v || null, complex: nextComplex || null });
            }} placeholder="Ej. A" />

            <BigInput label="Jabas" value={jabas} onChange={(v) => { setJabas(v); scheduleGuardado({ jabas: v ? Number(v) : null }); }} />
            <BigInput label="Unidades (cantidad de aves)" value={cantidad} onChange={(v) => { setCantidad(v); scheduleGuardado({ cantidad: Number(v) || 0 }); }} />
            <BigInput label="Densidad" value={densidad} onChange={(v) => { setDensidad(v); scheduleGuardado({ densidad: v ? Number(v) : null }); }} />
            <BigInput label="Promedio vivo (kg)" value={promVivo} onChange={(v) => { setPromVivo(v); scheduleGuardado({ promVivo: v ? Number(v) : null }); }} />
            <BigInput label="Promedio beneficiado (kg)" value={promBeneficiado} onChange={(v) => { setPromBeneficiado(v); scheduleGuardado({ promBeneficiado: v ? Number(v) : null }); }} />
            <BigInput label="N° de Guía" type="text" value={nroGuia} onChange={(v) => { setNroGuia(v); scheduleGuardado({ nroGuia: v || null }); }} />

            <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-[14px]">
              <span className="mb-1 block text-sm font-semibold text-slate-500">Complex Entity</span>
              <p className="font-mono text-base font-bold text-slate-700">{complex || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">Plantel-Campaña-Galpón-Sexo-Corral</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-[14px]">
            <p className="text-sm text-slate-500">Registra las temperaturas en °C al momento de la descarga.</p>
            <BigInput label="Vehículo con jabas (°C)" value={tempCamion}
              onChange={(v) => { setTempCamion(v); scheduleGuardado({ tempCamion: v ? Number(v) : null }); }} />
            <BigInput label="Plataforma sin jabas (°C)" value={tempPlataformaVacia}
              onChange={(v) => { setTempPlataformaVacia(v); scheduleGuardado({ tempPlataformaVacia: v ? Number(v) : null }); }} />
            <BigInput label="Plataforma con jabas (°C)" value={tempPlataforma}
              onChange={(v) => { setTempPlataforma(v); scheduleGuardado({ tempPlataforma: v ? Number(v) : null }); }} />
          </div>
        );

      case 3: {
        const almTotal = alm.sinLesion + alm.leve + alm.grave;
        const rasTotal = ras.sinLesion + ras.leve + ras.grave;
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Muestra de 200 aves. Registra almohadillas y rasguños simultáneamente.</p>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Almohadillas</h3>
                <span className="text-sm text-slate-400">Muestra: {almTotal}</span>
              </div>
              <div className="space-y-2">
                {([
                  { key: "sinLesion", label: "Sin lesión" },
                  { key: "leve", label: "Leve" },
                  { key: "grave", label: "Grave" },
                ] as const).map(({ key, label }) => (
                  <Counter key={key} label={label} value={alm[key]} onChange={(v) => {
                    const next = { ...alm, [key]: v };
                    setAlm(next);
                    scheduleGuardado({ lesionAlmohadillas: next });
                  }} />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Rasguños</h3>
                <span className="text-sm text-slate-400">Muestra: {rasTotal}</span>
              </div>
              <div className="space-y-2">
                {([
                  { key: "sinLesion", label: "Sin lesión" },
                  { key: "leve", label: "Leve" },
                  { key: "grave", label: "Severo" },
                ] as const).map(({ key, label }) => (
                  <Counter key={key} label={label} value={ras[key]} onChange={(v) => {
                    const next = { ...ras, [key]: v };
                    setRas(next);
                    scheduleGuardado({ lesionRasgunos: next });
                  }} />
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 4: {
        const hemDetalleTotal = Object.values(hemDetalle).reduce((a, b) => a + b, 0);
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Muestra de 50 aves. Registra aves con y sin hematomas.</p>
            <Counter label="Con hematoma" value={hemCon} onChange={(v) => { setHemCon(v); scheduleGuardado({ hematomasCon: v }); }} />
            <Counter label="Sin hematoma" value={hemSin} onChange={(v) => { setHemSin(v); scheduleGuardado({ hematomasSin: v }); }} />
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Total evaluadas: <span className="font-mono font-bold text-slate-700">{hemCon + hemSin}</span> / 50
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Clasificación por grado y ubicación</h3>
                <span className="text-sm text-slate-400">Total: {hemDetalleTotal} / {hemCon}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-1 text-left text-xs font-medium text-slate-400"></th>
                      {UBICACIONES_HEMATOMA.map((u) => (
                        <th key={u.key} className="p-1 text-center text-xs font-medium text-slate-400">{u.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GRADOS_HEMATOMA.map((g) => (
                      <tr key={g.key}>
                        <td className="p-1 whitespace-nowrap text-xs font-semibold text-slate-600">{g.label}</td>
                        {UBICACIONES_HEMATOMA.map((u) => (
                          <td key={u.key} className="p-1">
                            <input
                              type="number" min={0}
                              value={hemDetalle[`${g.key}_${u.key}`] || ""}
                              onChange={(e) => updateHematomaDetalle(g.key, u.key, Number(e.target.value) || 0)}
                              className="w-[54px] rounded-[8px] border border-slate-200 bg-white p-[9px] text-center font-mono text-sm"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 5: {
        const pigTotal = pig.reduce((a, b) => a + b, 0);
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Muestra de 100 aves. Total:{" "}
              <span className="font-mono font-bold text-slate-700">{pigTotal}</span> / 100
            </p>
            {pig.map((val, nivel) => (
              <Counter key={nivel} label={`Nivel ${nivel}`} value={val} onChange={(v) => {
                const next = [...pig];
                next[nivel] = v;
                setPig(next);
                scheduleGuardado({
                  pigNivel0: next[0], pigNivel1: next[1], pigNivel2: next[2], pigNivel3: next[3],
                  pigNivel4: next[4], pigNivel5: next[5], pigNivel6: next[6], pigNivel7: next[7],
                });
              }} />
            ))}
          </div>
        );
      }

      case 6: {
        const totalUnidades = [...principales, ...extraTipos].reduce((s, t) => s + (defectos[t.id]?.unidades ?? 0), 0);
        const totalKg = [...principales, ...extraTipos].reduce((s, t) => s + (defectos[t.id]?.kg ?? 0), 0);
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Aves que entrega el cliente como selección. Un defecto por ave.</p>

            <div className="space-y-3">
              {principales.map((tipo) => (
                <DefectoCard key={tipo.id} nombre={tipo.nombre} tipoId={tipo.id} defectos={defectos} updateDefecto={updateDefecto} />
              ))}
              {extraTipos.map((tipo) => (
                <DefectoCard
                  key={tipo.id} nombre={tipo.nombre} tipoId={tipo.id} defectos={defectos} updateDefecto={updateDefecto}
                  onRemove={() => {
                    setExtraIds((prev) => prev.filter((x) => x !== tipo.id));
                    const next = { ...defectos };
                    delete next[tipo.id];
                    setDefectos(next);
                    scheduleGuardado({ defectos: Object.entries(next).map(([tipoDefectoId, v]) => ({ tipoDefectoId, ...v })) });
                  }}
                />
              ))}
            </div>

            {disponibles.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-500">+ Agregar defecto</span>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setExtraIds((prev) => [...prev, e.target.value]); }}
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-[14px] text-base text-slate-700"
                >
                  <option value="">Selecciona...</option>
                  {disponibles.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}{t.categoria ? ` (${t.categoria})` : ""}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Total selección:{" "}
              <span className="font-mono font-bold text-slate-700">{totalUnidades}</span> uds ·{" "}
              <span className="font-mono font-bold text-slate-700">{totalKg.toFixed(1)}</span> kg
            </div>
          </div>
        );
      }

      case 7: {
        const gruposMerma = [
          {
            label: "Alas",
            grados: tiposMerma.filter((t) => t.categoria === "Alas" && t.nombre.includes("Grado")),
            rota: tiposMerma.find((t) => t.nombre === "Alas Rota"),
          },
          {
            label: "Pierna",
            grados: tiposMerma.filter((t) => t.categoria === "Pierna" && t.nombre.includes("Grado")),
            rota: tiposMerma.find((t) => t.nombre === "Pierna Rota"),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">Mutilados / Merma</h3>
              {gruposMerma.map((grupo) => (
                <div key={grupo.label} className="rounded-[14px] border border-slate-200 bg-slate-50 p-[14px]">
                  <p className="mb-3 text-[15px] font-bold text-slate-800">{grupo.label}</p>

                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Mutilación por grado</p>
                  <div className="space-y-2">
                    {grupo.grados.map((tipo) => (
                      <DefectoCard key={tipo.id} nombre={tipo.nombre} tipoId={tipo.id} defectos={defectos} updateDefecto={updateDefecto} />
                    ))}
                  </div>

                  {grupo.rota && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Rota (sin grado)</p>
                      <DefectoCard nombre={grupo.rota.nombre} tipoId={grupo.rota.id} defectos={defectos} updateDefecto={updateDefecto} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-500">Observaciones</span>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => { setObservaciones(e.target.value); scheduleGuardado({ observaciones: e.target.value || null }); }}
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-[14px] text-base text-slate-700 focus:outline-none"
                placeholder="Notas adicionales..."
                onFocus={(e) => { e.currentTarget.style.borderColor = SF_BLUE; e.currentTarget.style.boxShadow = `0 0 0 1px ${SF_BLUE}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
              />
            </label>
          </div>
        );
      }

      default:
        return null;
    }
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-[16px] p-8 ring-1 ring-blue-200" style={{ background: "#eff6ff" }}>
          <p className="text-5xl">✓</p>
          <h2 className="mt-3 text-xl font-extrabold" style={{ color: SF_BLUE }}>Evaluación completa</h2>
          <button
            type="button"
            onClick={() => router.push(`/jornadas/${jornadaId}`)}
            className="mt-5 h-[56px] w-full rounded-[16px] px-6 text-lg font-extrabold text-white"
            style={{ background: SF_BLUE }}
          >
            Volver a la jornada
          </button>
        </div>
      </div>
    );
  }

  // Primary button enabled state
  const primaryDisabled = isPending || (!sexo && paso === 1);

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* ---- WizardTopBar ---- */}
      <div className="mb-4 rounded-[16px] bg-white px-4 pb-3 pt-2.5 shadow-sm ring-1 ring-slate-200">
        {/* Row 1: back + pill */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/jornadas/${jornadaId}`)}
            className="text-sm font-semibold"
            style={{ color: SF_BLUE }}
          >
            ← Jornada
          </button>
          <div className="flex items-center gap-2">
            {saveStatus !== "idle" && (
              <span className="text-xs text-slate-400">
                {saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado ✓" : "Error"}
              </span>
            )}
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-extrabold text-slate-600"
              style={{ borderColor: "#cbd5e1" }}
            >
              {paso} / 7
            </span>
          </div>
        </div>

        {/* Row 2: step title */}
        <p className="mt-1.5 text-[19px] font-extrabold text-slate-900">{PASO_LABELS[paso - 1]}</p>

        {/* Row 3: 7 segments */}
        <div className="mt-2.5 flex gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="h-[5px] flex-1 rounded-sm"
              style={{
                background: i < paso ? SF_BLUE : "transparent",
                outline: i < paso ? "none" : "1.5px solid #cbd5e1",
              }}
            />
          ))}
        </div>
      </div>

      {/* ---- Step content ---- */}
      <div className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {renderStep()}
      </div>

      {/* Hidden camera input */}
      <input
        key={`cam-${cameraKey}`}
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePhotoCapture(e.target.files)}
      />

      {/* ---- Fixed bottom action bar ---- */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-lg px-4 pb-4 pt-2.5">
          <div className="flex items-center gap-2">
            {/* Photo button */}
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={fotos.length >= 5}
              className="flex h-[56px] w-[56px] flex-none flex-col items-center justify-center rounded-[13px] border border-slate-200 bg-slate-50 disabled:opacity-40"
              title={`Fotos ${fotos.length}/5`}
            >
              <span className="text-lg leading-none">📷</span>
              <span className="text-[10px] text-slate-400">{fotos.length}/5</span>
            </button>

            {/* Atrás */}
            {paso > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isPending}
                className="h-[56px] w-[72px] flex-none rounded-[16px] border border-slate-200 bg-white text-sm font-semibold text-slate-600 disabled:opacity-60"
              >
                Atrás
              </button>
            )}

            {/* Primary action */}
            {paso < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={primaryDisabled}
                className="h-[56px] flex-1 rounded-[16px] text-lg font-extrabold text-white"
                style={{ background: primaryDisabled ? "#94a3b8" : SF_BLUE, opacity: primaryDisabled ? 0.45 : 1 }}
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompletar}
                disabled={isPending}
                className="h-[56px] flex-1 rounded-[16px] text-lg font-extrabold text-white"
                style={{ background: isPending ? "#94a3b8" : "#059669", opacity: isPending ? 0.45 : 1 }}
              >
                Completar ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

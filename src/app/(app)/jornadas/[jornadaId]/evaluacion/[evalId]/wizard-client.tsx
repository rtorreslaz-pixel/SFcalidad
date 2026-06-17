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
  galpon: string | null;
  jabas: number | null;
  cantidad: number;
  promVivo: number | null;
  promBeneficiado: number | null;
  nroGuia: string | null;
  complex: string | null;
  tempPlataforma: number | null;
  tempCamion: number | null;
  tempAves: number | null;
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

// ---- Helpers ----
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
  { key: "ESPINAZO", label: "Espinazo" },
  { key: "PECHUGA", label: "Pechuga" },
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

function BigInput({ label, type = "number", value, onChange, placeholder, optional }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {optional && <span className="text-slate-400 text-xs">(opcional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
    </label>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-lg font-bold text-slate-600 active:bg-slate-300"
        >
          −
        </button>
        <input
          type="number" min={0}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 rounded-lg border border-slate-200 bg-white py-2 text-center text-base font-semibold"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-700 active:bg-emerald-200"
        >
          +
        </button>
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
  const [galpon, setGalpon] = useState(initial.galpon ?? "");
  const [jabas, setJabas] = useState(String(initial.jabas ?? ""));
  const [cantidad, setCantidad] = useState(String(initial.cantidad || ""));
  const [promVivo, setPromVivo] = useState(String(initial.promVivo ?? ""));
  const [promBeneficiado, setPromBeneficiado] = useState(String(initial.promBeneficiado ?? ""));
  const [nroGuia, setNroGuia] = useState(initial.nroGuia ?? "");
  const [complex, setComplex] = useState(initial.complex ?? "");

  // Step 2 state
  const [tempPlataforma, setTempPlataforma] = useState(String(initial.tempPlataforma ?? ""));
  const [tempCamion, setTempCamion] = useState(String(initial.tempCamion ?? ""));
  const [tempAves, setTempAves] = useState(String(initial.tempAves ?? ""));

  // Step 3 state (almohadillas + rasguños)
  type LesionKey = "ALMOHADILLAS" | "RASGUNOS";
  const getLesion = (cat: LesionKey) => {
    const ev = initial.evaluacionesLesion.find((e) => e.categoria === cat);
    return ev ? { sinLesion: ev.sinLesion, leve: ev.leve, grave: ev.grave } : { sinLesion: 0, leve: 0, grave: 0 };
  };
  const [alm, setAlm] = useState(getLesion("ALMOHADILLAS"));
  const [ras, setRas] = useState(getLesion("RASGUNOS"));

  // Step 4 state (hematomas)
  const [hemCon, setHemCon] = useState(initial.hematomasCon ?? 0);
  const [hemSin, setHemSin] = useState(initial.hematomasSin ?? 0);
  const [hemDetalle, setHemDetalle] = useState<Record<string, number>>(() => {
    const vals: Record<string, number> = {};
    initial.hematomaDetalles.forEach((d) => {
      vals[`${d.grado}_${d.ubicacion}`] = d.cantidad;
    });
    return vals;
  });

  // Step 5 state (pigmentación)
  const [pig, setPig] = useState([
    initial.pigNivel0, initial.pigNivel1, initial.pigNivel2, initial.pigNivel3,
    initial.pigNivel4, initial.pigNivel5, initial.pigNivel6, initial.pigNivel7,
  ]);

  // Step 6 state (defectos de selección)
  type DefectoVals = Record<string, { unidades: number; kg: number }>;
  const [defectos, setDefectos] = useState<DefectoVals>(() => {
    const vals: DefectoVals = {};
    initial.defectos.forEach((d) => {
      vals[d.tipoDefectoId] = { unidades: d.unidades, kg: d.kg };
    });
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
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      });
    }, 800);
  }, [initial.id]);

  // Defects helpers
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

  function renderDefectoCampos(tipo: TipoDefecto) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-slate-500">Unidades</span>
          <input type="number" min={0}
            value={defectos[tipo.id]?.unidades || ""}
            onChange={(e) => updateDefecto(tipo.id, "unidades", Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Kg</span>
          <input type="number" min={0} step="0.01"
            value={defectos[tipo.id]?.kg || ""}
            onChange={(e) => updateDefecto(tipo.id, "kg", Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
          />
        </label>
      </div>
    );
  }

  function updateHematomaDetalle(grado: string, ubicacion: string, value: number) {
    const next = { ...hemDetalle, [`${grado}_${ubicacion}`]: value };
    setHemDetalle(next);
    scheduleGuardado({
      hematomaDetalles: Object.entries(next).map(([key, cantidad]) => {
        const [grado, ubicacion] = key.split("_");
        return { grado, ubicacion, cantidad };
      }),
    });
  }

  // Photo upload
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

  // Navigation
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
  }

  const plantelLabel = (p: Plantel) => `${p.codigo}${p.subZona ? ` · ${p.subZona}` : ""}${p.zona ? ` (${p.zona})` : ""}`;

  // ---- Step renderers ----
  function renderStep() {
    switch (paso) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Sexo selector — big buttons */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Sexo <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-3">
                {(["MACHO", "HEMBRA"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSexo(s); scheduleGuardado({ sexo: s }); }}
                    className={`rounded-xl py-4 text-sm font-semibold transition ${
                      sexo === s
                        ? s === "MACHO" ? "bg-blue-600 text-white" : "bg-pink-600 text-white"
                        : "border-2 border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {s === "MACHO" ? "Macho" : "Hembra"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Plantel</span>
              <input
                type="text"
                list="planteles-list"
                value={plantelQuery}
                onChange={(e) => {
                  setPlantelQuery(e.target.value);
                  const match = planteles.find((p) => plantelLabel(p) === e.target.value);
                  const id = match ? match.id : "";
                  setPlantelId(id);
                  scheduleGuardado({ plantelId: id || null });
                }}
                placeholder="Busca por código..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <datalist id="planteles-list">
                {planteles.map((p) => <option key={p.id} value={plantelLabel(p)} />)}
              </datalist>
            </label>

            <BigInput label="Galpón" type="text" value={galpon} onChange={(v) => { setGalpon(v); scheduleGuardado({ galpon: v || null }); }} placeholder="Ej. 11A" />
            <BigInput label="Jabas" value={jabas} onChange={(v) => { setJabas(v); scheduleGuardado({ jabas: v ? Number(v) : null }); }} />
            <BigInput label="Unidades (cantidad de aves)" value={cantidad} onChange={(v) => { setCantidad(v); scheduleGuardado({ cantidad: Number(v) || 0 }); }} />
            <BigInput label="Promedio vivo (kg)" value={promVivo} onChange={(v) => { setPromVivo(v); scheduleGuardado({ promVivo: v ? Number(v) : null }); }} optional />
            <BigInput label="Promedio beneficiado (kg)" value={promBeneficiado} onChange={(v) => { setPromBeneficiado(v); scheduleGuardado({ promBeneficiado: v ? Number(v) : null }); }} optional />
            <BigInput label="N° de Guía" type="text" value={nroGuia} onChange={(v) => { setNroGuia(v); scheduleGuardado({ nroGuia: v || null }); }} optional />
            <BigInput label="Complex" type="text" value={complex} onChange={(v) => { setComplex(v); scheduleGuardado({ complex: v || null }); }} optional />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Registra las temperaturas en °C al momento de la descarga.</p>
            <BigInput
              label="Temperatura plataforma (°C)"
              value={tempPlataforma}
              onChange={(v) => { setTempPlataforma(v); scheduleGuardado({ tempPlataforma: v ? Number(v) : null }); }}
            />
            <BigInput
              label="Temperatura camión — parte media (°C)"
              value={tempCamion}
              onChange={(v) => { setTempCamion(v); scheduleGuardado({ tempCamion: v ? Number(v) : null }); }}
            />
            <BigInput
              label="Temperatura aves en plataforma (°C)"
              value={tempAves}
              onChange={(v) => { setTempAves(v); scheduleGuardado({ tempAves: v ? Number(v) : null }); }}
            />
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
                <h3 className="font-semibold text-slate-800">Almohadillas</h3>
                <span className="text-sm text-slate-500">Muestra: {almTotal}</span>
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
                <h3 className="font-semibold text-slate-800">Rasguños</h3>
                <span className="text-sm text-slate-500">Muestra: {rasTotal}</span>
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Total evaluadas: {hemCon + hemSin} / 50
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Clasificación por grado y ubicación</h3>
                <span className="text-sm text-slate-500">Total: {hemDetalleTotal} / {hemCon}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-1 text-left text-xs font-medium text-slate-500"></th>
                      {UBICACIONES_HEMATOMA.map((u) => (
                        <th key={u.key} className="p-1 text-center text-xs font-medium text-slate-500">{u.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GRADOS_HEMATOMA.map((g) => (
                      <tr key={g.key}>
                        <td className="p-1 whitespace-nowrap text-xs font-medium text-slate-600">{g.label}</td>
                        {UBICACIONES_HEMATOMA.map((u) => (
                          <td key={u.key} className="p-1">
                            <input
                              type="number" min={0}
                              value={hemDetalle[`${g.key}_${u.key}`] || ""}
                              onChange={(e) => updateHematomaDetalle(g.key, u.key, Number(e.target.value) || 0)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm"
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

      case 5:
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Muestra de 100 aves. Total: {pig.reduce((a, b) => a + b, 0)} / 100</p>
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

      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Aves que entrega el cliente como selección. Un defecto por ave.</p>

            {/* Principales */}
            <div className="space-y-3">
              {principales.map((tipo) => (
                <div key={tipo.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">{tipo.nombre}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-slate-500">Unidades</span>
                      <input type="number" min={0}
                        value={defectos[tipo.id]?.unidades || ""}
                        onChange={(e) => updateDefecto(tipo.id, "unidades", Number(e.target.value) || 0)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">Kg</span>
                      <input type="number" min={0} step="0.01"
                        value={defectos[tipo.id]?.kg || ""}
                        onChange={(e) => updateDefecto(tipo.id, "kg", Number(e.target.value) || 0)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Extra defects */}
            {extraTipos.map((tipo) => (
              <div key={tipo.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{tipo.nombre}</p>
                  <button type="button" onClick={() => {
                    setExtraIds((prev) => prev.filter((x) => x !== tipo.id));
                    const next = { ...defectos };
                    delete next[tipo.id];
                    setDefectos(next);
                    scheduleGuardado({ defectos: Object.entries(next).map(([tipoDefectoId, v]) => ({ tipoDefectoId, ...v })) });
                  }} className="text-xs text-slate-400 hover:text-red-500">Quitar</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs text-slate-500">Unidades</span>
                    <input type="number" min={0}
                      value={defectos[tipo.id]?.unidades || ""}
                      onChange={(e) => updateDefecto(tipo.id, "unidades", Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Kg</span>
                    <input type="number" min={0} step="0.01"
                      value={defectos[tipo.id]?.kg || ""}
                      onChange={(e) => updateDefecto(tipo.id, "kg", Number(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base"
                    />
                  </label>
                </div>
              </div>
            ))}

            {disponibles.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">+ Agregar defecto</span>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setExtraIds((prev) => [...prev, e.target.value]); }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
                >
                  <option value="">Selecciona...</option>
                  {disponibles.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}{t.categoria ? ` (${t.categoria})` : ""}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        );

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
              <h3 className="font-semibold text-slate-800">Mutilados / Merma</h3>
              {gruposMerma.map((grupo) => (
                <div key={grupo.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-800">{grupo.label}</p>

                  <p className="mb-1 text-xs font-medium text-slate-500">Mutilación (por grado)</p>
                  <div className="space-y-2">
                    {grupo.grados.map((tipo) => (
                      <div key={tipo.id} className="rounded-lg border border-slate-200 bg-white p-2">
                        <p className="mb-1 text-xs font-medium text-slate-600">{tipo.nombre}</p>
                        {renderDefectoCampos(tipo)}
                      </div>
                    ))}
                  </div>

                  {grupo.rota && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-slate-500">Rota (aparte, sin grado)</p>
                      <div className="rounded-lg border border-slate-200 bg-white p-2">
                        {renderDefectoCampos(grupo.rota)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Observaciones</span>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => { setObservaciones(e.target.value); scheduleGuardado({ observaciones: e.target.value || null }); }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Notas adicionales..."
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
        <div className="rounded-xl bg-emerald-50 p-8 ring-1 ring-emerald-200">
          <p className="text-4xl">✓</p>
          <h2 className="mt-2 text-lg font-bold text-emerald-800">Evaluación completa</h2>
          <button
            type="button"
            onClick={() => router.push(`/jornadas/${jornadaId}`)}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Volver a la jornada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-4">
        <button type="button" onClick={() => router.push(`/jornadas/${jornadaId}`)} className="text-sm text-emerald-700 hover:underline">
          ← Jornada
        </button>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-900">Paso {paso} de 7</h1>
          <span className="text-xs text-slate-400">
            {saveStatus === "saving" ? "Guardando..." : saveStatus === "saved" ? "Guardado ✓" : saveStatus === "error" ? "Error al guardar" : ""}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-500">{PASO_LABELS[paso - 1]}</p>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(paso / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {renderStep()}
      </div>

      {/* Photo floating button (always visible) */}
      <div className="mt-3">
        <input
          key={`cam-${cameraKey}`}
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotoCapture(e.target.files)}
        />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={fotos.length >= 5}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          📷 Agregar foto ({fotos.length}/5)
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-3">
        {paso > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Atrás
          </button>
        )}
        {paso < 7 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isPending || (!sexo && paso === 1)}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompletar}
            disabled={isPending}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            Completar evaluación ✓
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createInspectionAction } from "../inspecciones-actions";
import { calcularPorcentajeSeleccion, META_SELECCION_DEFAULT } from "@/lib/calc";

type Plantel = {
  id: string;
  codigo: string;
  nombre: string | null;
  zona: string | null;
  subZona: string | null;
  tipoPlantel: string | null;
  zonaEvaluacion: string | null;
};

type Cliente = {
  id: string;
  nombre: string;
};

type TipoDefecto = {
  id: string;
  nombre: string;
  categoria: string | null;
  orden: number;
  principal: boolean;
};

type Verificador = {
  id: string;
  nombre: string;
  role: string;
};

type CurrentUser = {
  id: string;
  nombre: string;
  role: string;
};

type DefectoValores = Record<string, { unidades: number; kg: number }>;
type LesionValores = Record<string, { sinLesion: number; leve: number; grave: number }>;

const CATEGORIAS_LESION = [
  { value: "ALMOHADILLAS", label: "Almohadillas", graveLabel: "Grave" },
  { value: "RASGUNOS", label: "Rasguños", graveLabel: "Severo" },
] as const;

const SEXOS_LESION = [
  { value: "MACHO", label: "Macho" },
  { value: "HEMBRA", label: "Hembra" },
] as const;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function DefectoFila({
  tipo,
  defectos,
  updateDefecto,
  onRemove,
}: {
  tipo: TipoDefecto;
  defectos: DefectoValores;
  updateDefecto: (id: string, field: "unidades" | "kg", value: number) => void;
  onRemove?: () => void;
}) {
  return (
    <tr>
      <td className="px-3 py-2">{tipo.nombre}</td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          min={0}
          name={`defecto_${tipo.id}_unidades`}
          value={defectos[tipo.id]?.unidades || ""}
          onChange={(e) => updateDefecto(tipo.id, "unidades", Number(e.target.value) || 0)}
          className="input"
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          min={0}
          step="0.01"
          name={`defecto_${tipo.id}_kg`}
          value={defectos[tipo.id]?.kg || ""}
          onChange={(e) => updateDefecto(tipo.id, "kg", Number(e.target.value) || 0)}
          className="input"
        />
      </td>
      {onRemove && (
        <td className="w-10 px-2 py-1.5 text-center">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ${tipo.nombre}`}
            className="text-slate-400 hover:text-red-600"
          >
            ✕
          </button>
        </td>
      )}
    </tr>
  );
}

function DefectoTabla({
  titulo,
  tipos,
  defectos,
  updateDefecto,
  onRemove,
}: {
  titulo?: string;
  tipos: TipoDefecto[];
  defectos: DefectoValores;
  updateDefecto: (id: string, field: "unidades" | "kg", value: number) => void;
  onRemove?: (id: string) => void;
}) {
  if (tipos.length === 0) return null;
  return (
    <div>
      {titulo && (
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{titulo}</h3>
      )}
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Defecto</th>
              <th className="w-28 px-3 py-2 font-medium">Unidades</th>
              <th className="w-28 px-3 py-2 font-medium">Kg</th>
              {onRemove && <th className="w-10 px-2 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tipos.map((tipo) => (
              <DefectoFila
                key={tipo.id}
                tipo={tipo}
                defectos={defectos}
                updateDefecto={updateDefecto}
                onRemove={onRemove ? () => onRemove(tipo.id) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContadorLesion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
          aria-label={`Restar ${label}`}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="input w-14 text-center"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
          aria-label={`Sumar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function InspectionForm({
  clientes,
  planteles,
  tiposDefecto,
  verificadores,
  currentUser,
}: {
  clientes: Cliente[];
  planteles: Plantel[];
  tiposDefecto: TipoDefecto[];
  verificadores: Verificador[];
  currentUser: CurrentUser;
}) {
  const [state, formAction, pending] = useActionState(createInspectionAction, undefined);

  const today = new Date().toISOString().slice(0, 10);

  const [clienteId, setClienteId] = useState("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [meta, setMeta] = useState<number>(META_SELECCION_DEFAULT);
  const [defectos, setDefectos] = useState<DefectoValores>({});
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [lesiones, setLesiones] = useState<LesionValores>({});

  const MAX_FOTOS = 5;
  const [fotos, setFotos] = useState<File[]>([]);
  const [cameraKey, setCameraKey] = useState(0);
  const [galeriaKey, setGaleriaKey] = useState(0);
  const fotosInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  const previews = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    if (!fotosInputRef.current) return;
    const dataTransfer = new DataTransfer();
    fotos.forEach((file) => dataTransfer.items.add(file));
    fotosInputRef.current.files = dataTransfer.files;
  }, [fotos]);

  function capturarUbicacion() {
    if (!("geolocation" in navigator)) {
      setUbicacionError("Este dispositivo no permite obtener la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUbicacionError(null);
      },
      () => setUbicacionError("No se pudo obtener la ubicación. Revisa los permisos del navegador."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function addFotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFotos((prev) => [...prev, ...Array.from(files)].slice(0, MAX_FOTOS));
    if (!ubicacion && !ubicacionError) capturarUbicacion();
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  const plantelLabel = (p: { codigo: string; subZona: string | null; zona: string | null }) =>
    `${p.codigo}${p.subZona ? ` · ${p.subZona}` : ""}${p.zona ? ` (${p.zona})` : ""}`;

  const [plantelId, setPlantelId] = useState("");
  const [plantelQuery, setPlantelQuery] = useState("");

  const principales = useMemo(
    () => tiposDefecto.filter((t) => t.principal).sort((a, b) => a.orden - b.orden),
    [tiposDefecto]
  );
  const mutiladosAlas = useMemo(
    () => tiposDefecto.filter((t) => t.categoria === "Alas").sort((a, b) => a.orden - b.orden),
    [tiposDefecto]
  );
  const mutiladosPierna = useMemo(
    () => tiposDefecto.filter((t) => t.categoria === "Pierna").sort((a, b) => a.orden - b.orden),
    [tiposDefecto]
  );
  const catalogoAdicional = useMemo(
    () =>
      tiposDefecto
        .filter((t) => !t.principal && t.categoria !== "Alas" && t.categoria !== "Pierna")
        .sort((a, b) => a.orden - b.orden),
    [tiposDefecto]
  );
  const extraTipos = useMemo(
    () =>
      extraIds
        .map((id) => tiposDefecto.find((t) => t.id === id))
        .filter((t): t is TipoDefecto => !!t),
    [extraIds, tiposDefecto]
  );
  const disponiblesParaAgregar = useMemo(
    () => catalogoAdicional.filter((t) => !extraIds.includes(t.id)),
    [catalogoAdicional, extraIds]
  );

  const totalUnidades = useMemo(
    () => Object.values(defectos).reduce((acc, d) => acc + (d.unidades || 0), 0),
    [defectos]
  );
  const totalKg = useMemo(
    () => Object.values(defectos).reduce((acc, d) => acc + (d.kg || 0), 0),
    [defectos]
  );
  const porcentaje = calcularPorcentajeSeleccion(totalUnidades, cantidad);
  const excedeMeta = cantidad > 0 && porcentaje > meta;

  function updateDefecto(id: string, field: "unidades" | "kg", value: number) {
    setDefectos((prev) => ({
      ...prev,
      [id]: { unidades: prev[id]?.unidades ?? 0, kg: prev[id]?.kg ?? 0, [field]: value },
    }));
  }

  function removeExtraDefecto(id: string) {
    setExtraIds((prev) => prev.filter((x) => x !== id));
    setDefectos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateLesion(key: string, field: "sinLesion" | "leve" | "grave", value: number) {
    setLesiones((prev) => ({
      ...prev,
      [key]: {
        sinLesion: prev[key]?.sinLesion ?? 0,
        leve: prev[key]?.leve ?? 0,
        grave: prev[key]?.grave ?? 0,
        [field]: Math.max(0, value),
      },
    }));
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Datos generales */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Datos generales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fecha" required>
            <input
              type="date"
              name="fecha"
              defaultValue={today}
              required
              className="input"
            />
          </Field>

          <Field label="Plantel">
            <input
              type="text"
              list="planteles-list"
              className="input"
              placeholder="Busca por código, zona o cliente..."
              value={plantelQuery}
              onChange={(e) => {
                const query = e.target.value;
                setPlantelQuery(query);
                const match = planteles.find((p) => plantelLabel(p) === query);
                setPlantelId(match ? match.id : "");
              }}
            />
            <datalist id="planteles-list">
              {planteles.map((p) => (
                <option key={p.id} value={plantelLabel(p)} />
              ))}
            </datalist>
            <input type="hidden" name="plantelId" value={plantelId} />
          </Field>

          <Field label="Cliente" required>
            <select
              name="clienteId"
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="input"
            >
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Galpón">
            <input type="text" name="galpon" placeholder="Ej. 11A" className="input" />
          </Field>

          <Field label="Sexo">
            <select name="sexo" className="input">
              <option value="">Selecciona...</option>
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </Field>

          <Field label="Cantidad de aves" required>
            <input
              type="number"
              name="cantidad"
              min={1}
              required
              value={cantidad || ""}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="input"
            />
          </Field>

          <Field label="Jabas">
            <input
              type="number"
              name="jabas"
              min={0}
              placeholder="Envases (7-10 aves c/u)"
              className="input"
            />
          </Field>

          <Field label="Campaña / Nro. Guía">
            <div className="flex gap-2">
              <input type="text" name="campania" placeholder="Campaña" className="input" />
              <input type="text" name="nroGuia" placeholder="Nro. guía" className="input" />
            </div>
          </Field>

          <Field label="Meta de selección (%)">
            <input
              type="number"
              step="0.01"
              name="metaPorcentaje"
              value={meta}
              onChange={(e) => setMeta(Number(e.target.value))}
              className="input"
            />
          </Field>

          {currentUser.role === "SUPERVISOR" && (
            <Field label="Verificador">
              <select name="verificadorId" className="input" defaultValue={currentUser.id}>
                {verificadores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </section>

      {/* Defectos */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Defectos encontrados</h2>
          <div
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              excedeMeta ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            % Selección: {porcentaje.toFixed(3)}% (meta {meta}%) · {totalUnidades} unid · {totalKg.toFixed(2)} kg
          </div>
        </div>

        <div className="space-y-5">
          <DefectoTabla
            titulo="Defectos principales"
            tipos={principales}
            defectos={defectos}
            updateDefecto={updateDefecto}
          />

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Mutilados (Alas / Pierna)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DefectoTabla tipos={mutiladosAlas} defectos={defectos} updateDefecto={updateDefecto} />
              <DefectoTabla tipos={mutiladosPierna} defectos={defectos} updateDefecto={updateDefecto} />
            </div>
          </div>

          {extraTipos.length > 0 && (
            <DefectoTabla
              titulo="Defectos adicionales"
              tipos={extraTipos}
              defectos={defectos}
              updateDefecto={updateDefecto}
              onRemove={removeExtraDefecto}
            />
          )}

          {disponiblesParaAgregar.length > 0 && (
            <label className="block max-w-xs">
              <span className="mb-1 block text-sm font-medium text-slate-700">+ Agregar defecto del catálogo</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setExtraIds((prev) => [...prev, e.target.value]);
                }}
                className="input"
              >
                <option value="">Selecciona...</option>
                {disponiblesParaAgregar.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                    {tipo.categoria ? ` (${tipo.categoria})` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      {/* Almohadillas y Rasguños */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Almohadillas y Rasguños</h2>
        <p className="mb-4 text-sm text-slate-500">
          Conteo por sexo. La muestra se calcula automáticamente como la suma de Sin lesión, Leve y{" "}
          {CATEGORIAS_LESION.map((c) => c.graveLabel.toLowerCase()).join("/")}.
        </p>
        <div className="space-y-5">
          {CATEGORIAS_LESION.map((cat) => (
            <div key={cat.value}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{cat.label}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {SEXOS_LESION.map((sexo) => {
                  const key = `${cat.value}_${sexo.value}`;
                  const valores = lesiones[key] ?? { sinLesion: 0, leve: 0, grave: 0 };
                  const muestra = valores.sinLesion + valores.leve + valores.grave;
                  return (
                    <div key={key} className="rounded-md border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{sexo.label}</span>
                        <span className="text-xs text-slate-500">Muestra: {muestra}</span>
                      </div>
                      <div className="space-y-2">
                        <ContadorLesion
                          label="Sin lesión"
                          value={valores.sinLesion}
                          onChange={(v) => updateLesion(key, "sinLesion", v)}
                        />
                        <ContadorLesion
                          label="Leve"
                          value={valores.leve}
                          onChange={(v) => updateLesion(key, "leve", v)}
                        />
                        <ContadorLesion
                          label={cat.graveLabel}
                          value={valores.grave}
                          onChange={(v) => updateLesion(key, "grave", v)}
                        />
                      </div>
                      <input type="hidden" name={`lesion_${key}_sinLesion`} value={valores.sinLesion} />
                      <input type="hidden" name={`lesion_${key}_leve`} value={valores.leve} />
                      <input type="hidden" name={`lesion_${key}_grave`} value={valores.grave} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fotos */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-2 font-semibold text-slate-900">Fotos referenciales</h2>
        <p className="mb-3 text-sm text-slate-500">
          Hasta {MAX_FOTOS} fotos de los hallazgos encontrados ({fotos.length}/{MAX_FOTOS}).
        </p>

        {/* Hidden input actually submitted with the form */}
        <input ref={fotosInputRef} type="file" name="fotos" multiple className="hidden" />
        <input type="hidden" name="fotoLat" value={ubicacion?.lat ?? ""} />
        <input type="hidden" name="fotoLng" value={ubicacion?.lng ?? ""} />

        {/* Camera capture: one photo per tap, can be tapped repeatedly. Remounted
            after each capture (via key) so the next tap starts from a fresh input. */}
        <input
          key={`camera-${cameraKey}`}
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            addFotos(e.target.files);
            setCameraKey((k) => k + 1);
          }}
        />

        {/* Gallery picker: supports selecting multiple files at once */}
        <input
          key={`galeria-${galeriaKey}`}
          ref={galeriaInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFotos(e.target.files);
            setGaleriaKey((k) => k + 1);
          }}
        />

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={fotos.length >= MAX_FOTOS}
            className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            📷 Tomar foto
          </button>
          <button
            type="button"
            onClick={() => galeriaInputRef.current?.click()}
            disabled={fotos.length >= MAX_FOTOS}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🖼️ Elegir de galería
          </button>
          <button
            type="button"
            onClick={capturarUbicacion}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            📍 {ubicacion ? "Actualizar ubicación" : "Capturar ubicación"}
          </button>
        </div>

        {ubicacion && (
          <p className="mb-3 text-xs text-slate-500">
            📍 Ubicación capturada: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
          </p>
        )}
        {ubicacionError && (
          <p className="mb-3 text-xs text-amber-600">{ubicacionError}</p>
        )}

        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {previews.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-md ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFoto(i)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Observaciones */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-2 font-semibold text-slate-900">Observaciones</h2>
        <textarea
          name="observaciones"
          rows={3}
          className="input"
          placeholder="Notas adicionales sobre la inspección..."
        />
      </section>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar inspección"}
        </button>
      </div>
    </form>
  );
}

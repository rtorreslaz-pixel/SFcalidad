"use client";

import { useEffect, useMemo, useState } from "react";

// Formulario de campo: el verificador lo llena de pie, en el local del cliente, con una mano.
// Botones grandes en vez de desplegables, observación y acción correctiva que se abren en línea
// al marcar "No conforme", y evidencia (foto/video) por ítem. El borrador se guarda en el propio
// teléfono para que una recarga o una pérdida de señal no borre lo avanzado.

type Item = {
  codigo: string;
  bloque: "DESCARGA" | "APILAMIENTO" | "VENTILACION";
  orden: number;
  descripcion: string;
  referenciaInstructivo: string | null;
  permiteNa: boolean;
  permiteVn: boolean;
};

type Resultado = "C" | "NC" | "NA" | "VN";
type Media = { itemCodigo: string | null; tipo: "FOTO" | "VIDEO"; path: string; bytes?: number };

const BLOQUE_LABEL: Record<Item["bloque"], string> = {
  DESCARGA: "Descarga",
  APILAMIENTO: "Apilamiento",
  VENTILACION: "Ventilación",
};

const RESULTADO_LABEL: Record<Resultado, string> = {
  C: "Conforme",
  NC: "No conforme",
  NA: "No aplica",
  VN: "Vent. natural",
};

const MIN_OBSERVACION = 10;
const DRAFT_KEY = "apilamiento-borrador-v1";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 5);

export default function ApilamientoForm({
  clientes,
  items,
  token,
}: {
  clientes: { id: string; nombre: string }[];
  items: Item[];
  token: string;
}) {
  const [registroId, setRegistroId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [exito, setExito] = useState<{ codigo: string; porcentaje: number | null; semaforo: string; critico: boolean } | null>(
    null
  );

  // Cabecera
  const [fechaEvaluacion, setFechaEvaluacion] = useState(hoyISO());
  const [horaDescarga, setHoraDescarga] = useState(horaActual());
  const [clienteId, setClienteId] = useState("");
  const [local, setLocal] = useState("");
  const [verificadorNombre, setVerificadorNombre] = useState("");
  const [plantel, setPlantel] = useState("");
  const [galpon, setGalpon] = useState("");
  const [placaVehiculo, setPlacaVehiculo] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [sexo, setSexo] = useState<"MACHO" | "HEMBRA" | "MIXTO">("MACHO");
  const [densidadJaba, setDensidadJaba] = useState("");
  const [tipoVentilacion, setTipoVentilacion] = useState<"MECANICA" | "NATURAL" | "">("");
  const [cantidadVentiladores, setCantidadVentiladores] = useState("");

  // Checklist
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [acciones, setAcciones] = useState<Record<string, { descripcion: string; responsable: string; fechaCompromiso: string }>>(
    {}
  );
  const [medias, setMedias] = useState<Media[]>([]);
  const [subiendo, setSubiendo] = useState<string | null>(null);

  // Cierre
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [nombreResponsableLocal, setNombreResponsableLocal] = useState("");
  const [cargoResponsableLocal, setCargoResponsableLocal] = useState("");

  // Id del registro (se usa también para agrupar la evidencia subida) + borrador guardado.
  useEffect(() => {
    const guardado = typeof window !== "undefined" ? window.localStorage.getItem(DRAFT_KEY) : null;
    if (guardado) {
      try {
        const d = JSON.parse(guardado);
        if (d.registroId) setRegistroId(d.registroId);
        if (d.fechaEvaluacion) setFechaEvaluacion(d.fechaEvaluacion);
        if (d.horaDescarga) setHoraDescarga(d.horaDescarga);
        if (d.clienteId) setClienteId(d.clienteId);
        if (d.local) setLocal(d.local);
        if (d.verificadorNombre) setVerificadorNombre(d.verificadorNombre);
        if (d.plantel) setPlantel(d.plantel);
        if (d.galpon) setGalpon(d.galpon);
        if (d.placaVehiculo) setPlacaVehiculo(d.placaVehiculo);
        if (d.cantidadJabas) setCantidadJabas(d.cantidadJabas);
        if (d.sexo) setSexo(d.sexo);
        if (d.densidadJaba) setDensidadJaba(d.densidadJaba);
        if (d.tipoVentilacion) setTipoVentilacion(d.tipoVentilacion);
        if (d.cantidadVentiladores) setCantidadVentiladores(d.cantidadVentiladores);
        if (d.resultados) setResultados(d.resultados);
        if (d.observaciones) setObservaciones(d.observaciones);
        if (d.acciones) setAcciones(d.acciones);
        if (d.medias) setMedias(d.medias);
        if (d.observacionesGenerales) setObservacionesGenerales(d.observacionesGenerales);
        if (d.nombreResponsableLocal) setNombreResponsableLocal(d.nombreResponsableLocal);
        if (d.cargoResponsableLocal) setCargoResponsableLocal(d.cargoResponsableLocal);
        return;
      } catch {
        /* borrador ilegible: se empieza de cero */
      }
    }
    setRegistroId(crypto.randomUUID());
  }, []);

  // Autoguardado del borrador en el teléfono.
  useEffect(() => {
    if (!registroId || exito) return;
    const draft = {
      registroId, fechaEvaluacion, horaDescarga, clienteId, local, verificadorNombre, plantel, galpon,
      placaVehiculo, cantidadJabas, sexo, densidadJaba, tipoVentilacion, cantidadVentiladores,
      resultados, observaciones, acciones, medias, observacionesGenerales, nombreResponsableLocal,
      cargoResponsableLocal,
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [registroId, exito, fechaEvaluacion, horaDescarga, clienteId, local, verificadorNombre, plantel, galpon,
    placaVehiculo, cantidadJabas, sexo, densidadJaba, tipoVentilacion, cantidadVentiladores, resultados,
    observaciones, acciones, medias, observacionesGenerales, nombreResponsableLocal, cargoResponsableLocal]);

  // RN-01: con ventilación natural los ítems del ventilador se marcan VN y quedan bloqueados.
  // RN-02: con ventilación mecánica esos ítems vuelven a estar sin responder (solo C o NC).
  useEffect(() => {
    if (!tipoVentilacion) return;
    setResultados((prev) => {
      const next = { ...prev };
      for (const item of items) {
        if (!item.permiteVn) continue;
        if (tipoVentilacion === "NATURAL") next[item.codigo] = "VN";
        else if (next[item.codigo] === "VN") delete next[item.codigo];
      }
      return next;
    });
  }, [tipoVentilacion, items]);

  const permitidos = (item: Item): Resultado[] => {
    const lista: Resultado[] = ["C", "NC"];
    if (item.permiteVn && tipoVentilacion === "NATURAL") lista.push("VN");
    if (item.permiteNa) lista.push("NA");
    return lista;
  };

  const respondidos = items.filter((i) => resultados[i.codigo]).length;
  const conformes = items.filter((i) => resultados[i.codigo] === "C").length;
  const noConformes = items.filter((i) => resultados[i.codigo] === "NC").length;
  const porcentaje = conformes + noConformes > 0 ? (conformes / (conformes + noConformes)) * 100 : null;
  const critico = resultados["APV-08"] === "NC";
  const semaforoColor = critico || (porcentaje != null && porcentaje < 85)
    ? "bg-red-100 text-red-700"
    : porcentaje != null && porcentaje < 95
      ? "bg-amber-100 text-amber-700"
      : porcentaje != null
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-500";

  const bloques = useMemo(() => {
    const grupos = new Map<Item["bloque"], Item[]>();
    for (const i of items) {
      const arr = grupos.get(i.bloque) ?? [];
      arr.push(i);
      grupos.set(i.bloque, arr);
    }
    return [...grupos.entries()];
  }, [items]);

  async function subirArchivo(itemCodigo: string, file: File | undefined) {
    if (!file || !registroId) return;
    setSubiendo(itemCodigo);
    setErrores([]);
    try {
      const fd = new FormData();
      fd.append("registroId", registroId);
      fd.append("file", file);
      const res = await fetch(`/api/apilamiento/media?k=${encodeURIComponent(token)}`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrores([data?.error ?? "No se pudo subir el archivo."]);
        return;
      }
      setMedias((prev) => [...prev, { itemCodigo, tipo: data.tipo, path: data.path, bytes: data.bytes }]);
    } catch {
      setErrores(["No se pudo subir el archivo. Revisa la señal e intenta de nuevo."]);
    } finally {
      setSubiendo(null);
    }
  }

  async function enviar() {
    setEnviando(true);
    setErrores([]);
    try {
      const res = await fetch(`/api/apilamiento?k=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registroId,
          fechaEvaluacion,
          horaDescarga,
          clienteId,
          local,
          verificadorNombre,
          plantel,
          galpon,
          placaVehiculo: placaVehiculo.toUpperCase(),
          cantidadJabas: Number(cantidadJabas),
          sexo,
          densidadJaba: Number(densidadJaba),
          tipoVentilacion,
          cantidadVentiladores: tipoVentilacion === "MECANICA" ? Number(cantidadVentiladores) : null,
          observacionesGenerales,
          nombreResponsableLocal,
          cargoResponsableLocal,
          respuestas: items
            .filter((i) => resultados[i.codigo])
            .map((i) => ({ itemCodigo: i.codigo, resultado: resultados[i.codigo], observacion: observaciones[i.codigo] ?? "" })),
          acciones: Object.entries(acciones)
            .filter(([codigo]) => resultados[codigo] === "NC")
            .map(([codigo, a]) => ({ itemCodigo: codigo, ...a })),
          medias,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrores(data?.errores ?? ["No se pudo guardar el registro."]);
        return;
      }
      window.localStorage.removeItem(DRAFT_KEY);
      setExito({
        codigo: data.codigoRegistro,
        porcentaje: data.porcentajeCumplimiento,
        semaforo: data.semaforo,
        critico: data.hallazgoCritico,
      });
    } catch {
      setErrores(["No se pudo enviar. Revisa la señal: lo que llenaste queda guardado en el teléfono."]);
    } finally {
      setEnviando(false);
    }
  }

  function nuevoRegistro() {
    window.localStorage.removeItem(DRAFT_KEY);
    window.location.reload();
  }

  if (exito) {
    return (
      <div className="p-4">
        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-4xl">{exito.critico ? "🔴" : exito.semaforo === "VERDE" ? "🟢" : exito.semaforo === "AMBAR" ? "🟡" : "🔴"}</div>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Registro enviado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Código <b className="text-slate-900">{exito.codigo}</b>
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {exito.porcentaje != null ? `${exito.porcentaje.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-slate-500">de cumplimiento</p>
          {exito.critico && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              Hallazgo crítico: el flujo de aire no da confort al ave (APV-08). Comunícalo al supervisor de inmediato.
            </p>
          )}
          <button
            onClick={nuevoRegistro}
            className="mt-6 w-full rounded-xl bg-[#0B4EA2] py-3 font-bold text-white"
          >
            Registrar otra verificación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Progreso y cumplimiento en vivo */}
      <div className="sticky top-[52px] z-10 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-700">
          {respondidos}/{items.length} ítems
        </div>
        <div className={`rounded-lg px-3 py-1 text-sm font-bold ${semaforoColor}`}>
          {porcentaje != null ? `${porcentaje.toFixed(0)}%` : "—"}
        </div>
      </div>

      {errores.length > 0 && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <div className="mb-1 font-bold">Revisa lo siguiente:</div>
          <ul className="list-inside list-disc space-y-1">
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Cabecera ---- */}
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-bold text-slate-900">1. Datos de la visita</h2>

        <Campo label="Verificador">
          <input className="inp" value={verificadorNombre} onChange={(e) => setVerificadorNombre(e.target.value)} placeholder="Tu nombre y apellido" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha">
            <input type="date" className="inp" max={hoyISO()} value={fechaEvaluacion} onChange={(e) => setFechaEvaluacion(e.target.value)} />
          </Campo>
          <Campo label="Hora de descarga">
            <input type="time" className="inp" value={horaDescarga} onChange={(e) => setHoraDescarga(e.target.value)} />
          </Campo>
        </div>

        <Campo label="Cliente / distribuidor">
          <select className="inp" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecciona…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>

        <Campo label="Local / sede (opcional)">
          <input className="inp" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ej. Local Norte" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Plantel de origen">
            <input className="inp" value={plantel} onChange={(e) => setPlantel(e.target.value)} placeholder="Ej. P208" />
          </Campo>
          <Campo label="Galpón (opcional)">
            <input className="inp" value={galpon} onChange={(e) => setGalpon(e.target.value)} />
          </Campo>
        </div>

        <Campo label="Placa del vehículo">
          <input
            className="inp uppercase"
            value={placaVehiculo}
            onChange={(e) => setPlacaVehiculo(e.target.value.toUpperCase())}
            placeholder="AAA-000"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cantidad de jabas">
            <input type="number" inputMode="numeric" className="inp" value={cantidadJabas} onChange={(e) => setCantidadJabas(e.target.value)} />
          </Campo>
          <Campo label="Aves por jaba">
            <input type="number" inputMode="numeric" min={1} max={20} className="inp" value={densidadJaba} onChange={(e) => setDensidadJaba(e.target.value)} />
          </Campo>
        </div>

        <Campo label="Sexo del lote">
          <div className="grid grid-cols-3 gap-2">
            {(["MACHO", "HEMBRA", "MIXTO"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSexo(s)} className={chip(sexo === s)}>
                {s === "MACHO" ? "Macho" : s === "HEMBRA" ? "Hembra" : "Mixto"}
              </button>
            ))}
          </div>
        </Campo>

        <Campo label="Tipo de ventilación del local">
          <div className="grid grid-cols-2 gap-2">
            {(["MECANICA", "NATURAL"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipoVentilacion(t)} className={chip(tipoVentilacion === t)}>
                {t === "MECANICA" ? "Mecánica (ventilador)" : "Natural"}
              </button>
            ))}
          </div>
          {!tipoVentilacion && (
            <p className="mt-1 text-xs text-slate-500">Elige el tipo de ventilación para habilitar el bloque de ventilación.</p>
          )}
        </Campo>

        {tipoVentilacion === "MECANICA" && (
          <Campo label="Cantidad de ventiladores">
            <input type="number" inputMode="numeric" min={1} className="inp" value={cantidadVentiladores} onChange={(e) => setCantidadVentiladores(e.target.value)} />
          </Campo>
        )}
      </section>

      {/* ---- Checklist ---- */}
      {bloques.map(([bloque, itemsBloque]) => (
        <section key={bloque} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-bold text-slate-900">{BLOQUE_LABEL[bloque]}</h2>

          {itemsBloque.map((item) => {
            const bloqueado = item.permiteVn && tipoVentilacion === "NATURAL";
            const valor = resultados[item.codigo];
            const obs = observaciones[item.codigo] ?? "";
            const accion = acciones[item.codigo] ?? { descripcion: "", responsable: "", fechaCompromiso: "" };
            const mediasItem = medias.filter((m) => m.itemCodigo === item.codigo);
            return (
              <div key={item.codigo} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                <div className="mb-2 flex gap-2">
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                    {item.codigo}
                  </span>
                  <p className="text-sm leading-snug text-slate-800">{item.descripcion}</p>
                </div>

                {bloqueado ? (
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                    Ventilación natural: no aplica el ventilador (no cuenta como incumplimiento).
                  </div>
                ) : (
                  <div className={`grid gap-2 ${permitidos(item).length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {permitidos(item).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResultados((p) => ({ ...p, [item.codigo]: r }))}
                        className={botonResultado(valor === r, r)}
                      >
                        {RESULTADO_LABEL[r]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Observación obligatoria en NC y NA, con evidencia y acción correctiva */}
                {(valor === "NC" || valor === "NA") && (
                  <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
                    <Campo label={`Observación (mínimo ${MIN_OBSERVACION} caracteres)`}>
                      <textarea
                        className="inp"
                        rows={2}
                        value={obs}
                        onChange={(e) => setObservaciones((p) => ({ ...p, [item.codigo]: e.target.value }))}
                        placeholder="Qué observaste exactamente"
                      />
                      {obs.trim().length > 0 && obs.trim().length < MIN_OBSERVACION && (
                        <p className="mt-1 text-xs text-amber-700">Faltan {MIN_OBSERVACION - obs.trim().length} caracteres.</p>
                      )}
                    </Campo>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700">
                        📷 Foto
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => subirArchivo(item.codigo, e.target.files?.[0])} />
                      </label>
                      <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700">
                        🎥 Video
                        <input type="file" accept="video/*" capture="environment" className="hidden"
                          onChange={(e) => subirArchivo(item.codigo, e.target.files?.[0])} />
                      </label>
                    </div>
                    {subiendo === item.codigo && <p className="text-xs text-slate-500">Subiendo archivo…</p>}
                    {mediasItem.length > 0 && (
                      <p className="text-xs font-semibold text-green-700">
                        ✓ {mediasItem.filter((m) => m.tipo === "FOTO").length} foto(s) ·{" "}
                        {mediasItem.filter((m) => m.tipo === "VIDEO").length} video(s) adjuntos
                      </p>
                    )}

                    {valor === "NC" && (
                      <div className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acción correctiva</p>
                        <textarea
                          className="inp"
                          rows={2}
                          placeholder="Qué se hizo o se hará para corregirlo"
                          value={accion.descripcion}
                          onChange={(e) => setAcciones((p) => ({ ...p, [item.codigo]: { ...accion, descripcion: e.target.value } }))}
                        />
                        <input
                          className="inp"
                          placeholder="Responsable"
                          value={accion.responsable}
                          onChange={(e) => setAcciones((p) => ({ ...p, [item.codigo]: { ...accion, responsable: e.target.value } }))}
                        />
                        <input
                          type="date"
                          className="inp"
                          min={fechaEvaluacion}
                          value={accion.fechaCompromiso}
                          onChange={(e) => setAcciones((p) => ({ ...p, [item.codigo]: { ...accion, fechaCompromiso: e.target.value } }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Evidencia opcional también en conformes */}
                {valor === "C" && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs font-semibold text-blue-700">
                      + Adjuntar foto/video
                      <input type="file" accept="image/*,video/*" capture="environment" className="hidden"
                        onChange={(e) => subirArchivo(item.codigo, e.target.files?.[0])} />
                    </label>
                    {mediasItem.length > 0 && <span className="text-xs text-green-700">✓ {mediasItem.length}</span>}
                    {subiendo === item.codigo && <span className="text-xs text-slate-500">subiendo…</span>}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {/* ---- Cierre ---- */}
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-bold text-slate-900">3. Cierre</h2>
        <Campo label="Observaciones generales (opcional)">
          <textarea className="inp" rows={3} value={observacionesGenerales} onChange={(e) => setObservacionesGenerales(e.target.value)} />
        </Campo>
        <Campo label="Responsable del local que recibe los hallazgos">
          <input className="inp" value={nombreResponsableLocal} onChange={(e) => setNombreResponsableLocal(e.target.value)} placeholder="Nombre" />
        </Campo>
        <Campo label="Cargo (opcional)">
          <input className="inp" value={cargoResponsableLocal} onChange={(e) => setCargoResponsableLocal(e.target.value)} />
        </Campo>
      </section>

      {critico && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200">
          Hallazgo crítico (APV-08): el registro se marcará en rojo y debe comunicarse al supervisor.
        </div>
      )}

      <button
        onClick={enviar}
        disabled={enviando || subiendo !== null}
        className="w-full rounded-xl bg-[#0B4EA2] py-4 text-base font-bold text-white disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar verificación"}
      </button>
      <p className="pb-4 text-center text-xs text-slate-500">
        Lo que llenas se guarda en este teléfono hasta que envíes.
      </p>

      <style jsx global>{`
        .inp {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.6rem;
          padding: 0.7rem 0.75rem;
          font-size: 0.95rem;
          background: #fff;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function chip(activo: boolean): string {
  return `rounded-lg border py-2.5 text-sm font-semibold ${
    activo ? "border-[#0B4EA2] bg-blue-50 text-[#002F86]" : "border-slate-300 bg-white text-slate-600"
  }`;
}

function botonResultado(activo: boolean, r: Resultado): string {
  if (!activo) return "rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600";
  if (r === "C") return "rounded-lg border border-green-600 bg-green-600 py-3 text-sm font-bold text-white";
  if (r === "NC") return "rounded-lg border border-red-600 bg-red-600 py-3 text-sm font-bold text-white";
  return "rounded-lg border border-slate-500 bg-slate-500 py-3 text-sm font-bold text-white";
}

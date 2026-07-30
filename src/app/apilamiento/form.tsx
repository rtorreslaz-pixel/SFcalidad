"use client";

import { useEffect, useMemo, useState } from "react";

// Formulario de campo: el verificador lo llena de pie, en el local del cliente, con una mano.
// Botones grandes en vez de desplegables, observación opcional y evidencia (foto/video) por ítem.
// El verificador solo levanta información: no se le piden acciones correctivas ni se le muestran
// valoraciones. El borrador se guarda en el propio teléfono para que una recarga o una pérdida de
// señal no borre lo avanzado.

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

const DRAFT_KEY = "apilamiento-borrador-v1";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 5);

export default function ApilamientoForm({
  clientes,
  items,
  token,
  localesPorCliente,
}: {
  clientes: { id: string; nombre: string }[];
  items: Item[];
  token: string;
  /** Locales ya registrados por cliente: se sugieren para que el nombre no se escriba distinto
   *  cada vez (el análisis es por local, así que la consistencia del nombre importa). */
  localesPorCliente: Record<string, string[]>;
}) {
  const [registroId, setRegistroId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  // El formulario solo captura: no muestra porcentaje, semáforo ni avisos de criticidad.
  // El análisis se hace después con los datos (reporte y CSV).
  const [exito, setExito] = useState<{ codigo: string } | null>(null);

  // Cabecera
  const [fechaEvaluacion, setFechaEvaluacion] = useState(hoyISO());
  const [clienteId, setClienteId] = useState("");
  const [local, setLocal] = useState("");
  const [verificadorNombre, setVerificadorNombre] = useState("");
  const [tipoVentilacion, setTipoVentilacion] = useState<"MECANICA" | "NATURAL" | "">("");
  const [cantidadVentiladores, setCantidadVentiladores] = useState("");

  // Checklist
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [medias, setMedias] = useState<Media[]>([]);
  const [subiendo, setSubiendo] = useState<string | null>(null);

  // Cierre
  const [observacionesGenerales, setObservacionesGenerales] = useState("");

  // Id del registro (se usa también para agrupar la evidencia subida) + borrador guardado.
  useEffect(() => {
    const guardado = typeof window !== "undefined" ? window.localStorage.getItem(DRAFT_KEY) : null;
    if (guardado) {
      try {
        const d = JSON.parse(guardado);
        if (d.registroId) setRegistroId(d.registroId);
        if (d.fechaEvaluacion) setFechaEvaluacion(d.fechaEvaluacion);
        if (d.clienteId) setClienteId(d.clienteId);
        if (d.local) setLocal(d.local);
        if (d.verificadorNombre) setVerificadorNombre(d.verificadorNombre);
        if (d.tipoVentilacion) setTipoVentilacion(d.tipoVentilacion);
        if (d.cantidadVentiladores) setCantidadVentiladores(d.cantidadVentiladores);
        if (d.resultados) setResultados(d.resultados);
        if (d.observaciones) setObservaciones(d.observaciones);
        if (d.medias) setMedias(d.medias);
        if (d.observacionesGenerales) setObservacionesGenerales(d.observacionesGenerales);
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
      registroId, fechaEvaluacion, clienteId, local, verificadorNombre, tipoVentilacion,
      cantidadVentiladores, resultados, observaciones, medias, observacionesGenerales,
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [registroId, exito, fechaEvaluacion, clienteId, local, verificadorNombre, tipoVentilacion,
    cantidadVentiladores, resultados, observaciones, medias, observacionesGenerales]);

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

  const bloques = useMemo(() => {
    const grupos = new Map<Item["bloque"], Item[]>();
    for (const i of items) {
      const arr = grupos.get(i.bloque) ?? [];
      arr.push(i);
      grupos.set(i.bloque, arr);
    }
    return [...grupos.entries()];
  }, [items]);

  // itemCodigo null = evidencia general del local (la foto/video de la ventilación), que no
  // pertenece a ningún ítem del checklist.
  async function subirArchivo(itemCodigo: string | null, file: File | undefined) {
    if (!file || !registroId) return;
    setSubiendo(itemCodigo ?? "GENERAL");
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
          clienteId,
          local,
          verificadorNombre,
          tipoVentilacion,
          cantidadVentiladores: tipoVentilacion === "MECANICA" ? Number(cantidadVentiladores) : null,
          observacionesGenerales,
          respuestas: items
            .filter((i) => resultados[i.codigo])
            .map((i) => ({ itemCodigo: i.codigo, resultado: resultados[i.codigo], observacion: observaciones[i.codigo] ?? "" })),
          medias,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrores(data?.errores ?? ["No se pudo guardar el registro."]);
        return;
      }
      window.localStorage.removeItem(DRAFT_KEY);
      setExito({ codigo: data.codigoRegistro });
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
          <div className="text-4xl">✓</div>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Registro enviado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Código <b className="text-slate-900">{exito.codigo}</b>
          </p>
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
      {/* Avance del llenado (sin porcentaje de cumplimiento ni semáforo: aquí solo se captura) */}
      <div className="sticky top-[52px] z-10 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
        {respondidos}/{items.length} ítems respondidos
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
        <h2 className="text-sm font-bold text-slate-900">Local evaluado</h2>

        <Campo label="Verificador">
          <input className="inp" value={verificadorNombre} onChange={(e) => setVerificadorNombre(e.target.value)} placeholder="Tu nombre y apellido" />
        </Campo>

        <Campo label="Fecha">
          <input type="date" className="inp" max={hoyISO()} value={fechaEvaluacion} onChange={(e) => setFechaEvaluacion(e.target.value)} />
        </Campo>

        <Campo label="Cliente / distribuidor">
          <select className="inp" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecciona…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>

        <Campo label="Local / sede">
          <input
            className="inp"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Ej. Local Norte"
            list="locales-sugeridos"
          />
          {/* Sugerencias de locales ya registrados para ese cliente: así el mismo local se
              escribe igual siempre y el análisis por local no se fragmenta. */}
          <datalist id="locales-sugeridos">
            {(localesPorCliente[clienteId] ?? []).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          {(localesPorCliente[clienteId] ?? []).length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Ya registrados: {(localesPorCliente[clienteId] ?? []).join(" · ")}
            </p>
          )}
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

          {/* Evidencia de la ventilación del local (no pertenece a un ítem del checklist) */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700">
              📷 Foto
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => subirArchivo(null, e.target.files?.[0])} />
            </label>
            <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700">
              🎥 Video
              <input type="file" accept="video/*" capture="environment" className="hidden"
                onChange={(e) => subirArchivo(null, e.target.files?.[0])} />
            </label>
          </div>
          {subiendo === "GENERAL" && <p className="mt-1 text-xs text-slate-500">Subiendo archivo…</p>}
          {medias.filter((m) => m.itemCodigo === null).length > 0 && (
            <p className="mt-1 text-xs font-semibold text-green-700">
              ✓ {medias.filter((m) => m.itemCodigo === null && m.tipo === "FOTO").length} foto(s) ·{" "}
              {medias.filter((m) => m.itemCodigo === null && m.tipo === "VIDEO").length} video(s) de la ventilación
            </p>
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

                {/* En NC y NA se ofrece observación (opcional) y evidencia */}
                {(valor === "NC" || valor === "NA") && (
                  <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
                    <Campo label="Observación (opcional)">
                      <textarea
                        className="inp"
                        rows={2}
                        value={obs}
                        onChange={(e) => setObservaciones((p) => ({ ...p, [item.codigo]: e.target.value }))}
                        placeholder="Qué observaste exactamente"
                      />
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
        <h2 className="text-sm font-bold text-slate-900">Cierre</h2>
        <Campo label="Observaciones generales (opcional)">
          <textarea className="inp" rows={3} value={observacionesGenerales} onChange={(e) => setObservacionesGenerales(e.target.value)} />
        </Campo>
      </section>

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

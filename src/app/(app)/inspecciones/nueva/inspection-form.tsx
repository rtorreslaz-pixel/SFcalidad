"use client";

import { useMemo, useState } from "react";
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
  planteles: Plantel[];
};

type TipoDefecto = {
  id: string;
  nombre: string;
  categoria: string | null;
  orden: number;
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

export default function InspectionForm({
  clientes,
  tiposDefecto,
  verificadores,
  currentUser,
}: {
  clientes: Cliente[];
  tiposDefecto: TipoDefecto[];
  verificadores: Verificador[];
  currentUser: CurrentUser;
}) {
  const [state, formAction, pending] = useActionState(createInspectionAction, undefined);

  const today = new Date().toISOString().slice(0, 10);

  const [clienteId, setClienteId] = useState("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [meta, setMeta] = useState<number>(META_SELECCION_DEFAULT);
  const [defectos, setDefectos] = useState<Record<string, { unidades: number; kg: number }>>({});

  const planteles = useMemo(
    () => clientes.find((c) => c.id === clienteId)?.planteles ?? [],
    [clientes, clienteId]
  );

  const categorias = useMemo(() => {
    const grupos = new Map<string, TipoDefecto[]>();
    for (const tipo of tiposDefecto) {
      const cat = tipo.categoria ?? "Otros";
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)!.push(tipo);
    }
    return Array.from(grupos.entries());
  }, [tiposDefecto]);

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

          <Field label="Plantel">
            <select name="plantelId" className="input" disabled={!clienteId}>
              <option value="">Selecciona...</option>
              {planteles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} {p.subZona ? `· ${p.subZona}` : ""}
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

          <Field label="Peso vivo (kg)">
            <input type="number" step="0.01" name="pesoVivo" className="input" />
          </Field>

          <Field label="Peso beneficio (kg)">
            <input type="number" step="0.01" name="pesoBeneficio" className="input" />
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
          {categorias.map(([categoria, tipos]) => (
            <div key={categoria}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {categoria}
              </h3>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Defecto</th>
                      <th className="w-28 px-3 py-2 font-medium">Unidades</th>
                      <th className="w-28 px-3 py-2 font-medium">Kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tipos.map((tipo) => (
                      <tr key={tipo.id}>
                        <td className="px-3 py-2">{tipo.nombre}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min={0}
                            name={`defecto_${tipo.id}_unidades`}
                            value={defectos[tipo.id]?.unidades || ""}
                            onChange={(e) =>
                              updateDefecto(tipo.id, "unidades", Number(e.target.value) || 0)
                            }
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fotos */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-2 font-semibold text-slate-900">Fotos referenciales</h2>
        <p className="mb-3 text-sm text-slate-500">Hasta 5 fotos de los hallazgos encontrados.</p>
        <input
          type="file"
          name="fotos"
          accept="image/*"
          multiple
          capture="environment"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
        />
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

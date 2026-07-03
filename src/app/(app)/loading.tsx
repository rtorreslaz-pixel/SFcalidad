// Esqueleto que App Router muestra al instante al cambiar de pestaña, mientras el
// servidor renderiza la página (algunas hacen queries pesados). Mejora la sensación
// de velocidad: en vez de esperar congelado, se ve el skeleton de inmediato.
// Nota: animate-pulse anima opacidad (no color/fondo con var()), así que no cae en
// el bug de Safari/WKWebView.
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Encabezado */}
      <div className="mb-6 h-7 w-48 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-80 max-w-full rounded bg-slate-200/70" />

      {/* Barra de filtros */}
      <div className="mb-6 h-20 rounded-xl bg-slate-200/60" />

      {/* Fila de KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200/60" />
        ))}
      </div>

      {/* Bloques de contenido */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-slate-200/60" />
        <div className="h-72 rounded-xl bg-slate-200/60" />
      </div>
    </div>
  );
}

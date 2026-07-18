# Documentación

Documentos de referencia del proyecto para el área usuaria y TI.

- **`DFU-Calidad-Pesaje.docx`** — Documento Funcional de Usuario: objetivos,
  situación actual, propuesta por módulos (con capturas) y arquitectura. Es el
  documento funcional para revisión/aprobación del área usuaria.
- **`PRD.md` / `PRD.docx`** — Product Requirements Document: requisitos
  funcionales (RF) y no funcionales (RNF) numerados y priorizados (MoSCoW),
  KPIs, historias de usuario, reglas de negocio, criterios de aceptación,
  riesgos y roadmap. Es la fuente de verdad del alcance para Producto/Desarrollo
  y TI (prescriptivo y verificable). El `.md` es el documento vivo versionable;
  el `.docx` es para compartir/adjuntar.
- **`arquitectura-tecnica.png`** — Diagrama de arquitectura técnica: stack actual
  (cliente, aplicación, datos) y la capa adaptable al stack corporativo
  (SQL Server, despliegue, SSO, Power BI).
- **`guia-prueba-app-pesaje.md`** — Guía para probar la app Android de pesaje:
  cómo obtener el APK, credenciales demo, checklist (con y sin báscula, offline,
  sincronización) y qué reportar.
- **`BD-Pesaje-diccionario-y-datos-de-prueba.xlsx`** — Diccionario de datos del
  pesaje (tabla local del celular + tablas del servidor) con filas de ejemplo:
  qué captura la app campo por campo, cómo queda en el servidor (complex,
  atribución, syncedAt) y las tablas de monitor en vivo y peso estándar.

Ver también, en la raíz del repo:
- `README.md` — cómo correr y desplegar la app.
- `INTEGRATION.md` — contrato de la API móvil (`/api/mobile/*`).
- `migration-spike/` — port a SQL Server (referencia para la migración de base de datos).

# PRD — Sistema de Calidad en Cliente y Pesaje Preventa en Granja

| | |
|---|---|
| **Documento** | Product Requirements Document (PRD) |
| **Producto** | Sistema de Calidad y Pesaje (control de calidad en cliente + pesaje preventa en granja) |
| **Versión** | 1.0 |
| **Estado** | Base para revisión de TI / Arquitectura |
| **Fecha** | 15/07/2026 |
| **Documentos relacionados** | DFU (funcional, con capturas), Diagrama de arquitectura técnica, Prototipo interactivo (`/prototipo`) |

> Este PRD define **qué debe cumplir** la solución y **cómo se valida**. Es prescriptivo y verificable, complementa al DFU (que es descriptivo y funcional) y no repite sus capturas ni su narrativa. Prioridades expresadas con **MoSCoW**: **M** (Must / obligatorio), **S** (Should / importante), **C** (Could / deseable), **W** (Won't / fuera de esta fase).

---

## 1. Contexto y problema

El control de calidad del pollo en el cliente y el pesaje preventa de las aves en granja se registran hoy de forma **manual** (papel y hojas de cálculo), con datos dispersos entre la granja y el cliente. Esto provoca: demora en la disponibilidad de la información, ausencia de trazabilidad del mismo lote de granja a cliente, y errores de consolidación manual.

Se dispone de una solución **omnicanal ya construida y funcional** (aplicación móvil para captura en campo + aplicación web para supervisión y administración) que digitaliza el proceso de punta a punta. Este PRD formaliza sus requisitos y define lo pendiente para su **productización en la infraestructura corporativa**.

## 2. Objetivos y KPIs de éxito

| # | Objetivo | KPI / métrica de éxito |
|---|---|---|
| O1 | Eliminar el registro manual en papel/Excel | 0 registros en papel; 100 % de pesajes y evaluaciones capturados en la herramienta |
| O2 | Disponibilidad inmediata del dato | Dato disponible en el servidor el mismo día (vs. días con el proceso manual) |
| O3 | Trazabilidad granja↔cliente | ≥ 95 % de lotes con cruce granja–cliente resuelto (campo `complex`) |
| O4 | Reducir errores de consolidación | Eliminación de la doble digitación; validaciones automáticas de campos e idempotencia |
| O5 | Operación en campo sin conexión | 100 % de la jornada operable sin señal; 0 pérdida de registros sincronizados |
| O6 | Soporte a la toma de decisiones | Indicadores y rankings disponibles en dashboard y exportables a Power BI |

## 3. Alcance

### 3.1 Dentro de alcance (fase actual)
- Registro de **calidad en cliente**: selección, pigmentación, pododermatitis, rasguños, hematomas, temperatura de transporte.
- **Pesaje preventa en granja** vía báscula Bluetooth (multi-marca), con peso en vivo.
- **Monitor de pesaje en tiempo real** de las básculas conectadas.
- **Trazabilidad** granja↔cliente (mismo lote).
- **Indicadores, rankings y tendencias**; **exportación CSV** para Power BI; **formatos oficiales en PDF**.
- **Administración de datos maestros** (clientes, planteles, campañas, tablas estándar) dentro de la herramienta.
- **App móvil offline** con cola de sincronización.
- **Gestión de usuarios y roles**.

### 3.2 Fuera de alcance (esta fase)
- Integración con **SAP** (fase futura).
- Cálculo de liquidaciones/costos de transporte (permanece en SAP).
- App para iOS (la app móvil es Android).

### 3.3 Pendiente para productización (fase de adopción corporativa)
- Migración del motor de base de datos a **SQL Server** (ya validada técnicamente).
- **Autenticación corporativa** (SSO / Active Directory).
- Despliegue en **infraestructura corporativa** (contenedor Docker).
- **Power BI corporativo** (workspace y gateway de la organización).
- Definición de **respaldos, SLA, perfiles definitivos y lineamientos de seguridad**.

## 4. Roles y personas

| Rol | Descripción | Uso principal |
|---|---|---|
| **Verificador** | Personal de campo | App móvil: pesaje en granja y evaluación de calidad |
| **Supervisor de Calidad** | Supervisa la operación de calidad | Web: dashboard, monitor, jornadas, inspecciones |
| **Jefe** | Jefatura del área | Web: indicadores y consolidados |
| **Comercial** | Área comercial | Web: monitor de pesaje y consultas |
| **Administrador** | Administra la herramienta | Web: catálogos, usuarios, tablas estándar |

## 5. Historias de usuario (por módulo)

**App móvil — Pesaje en granja**
- HU-01: Como **verificador**, quiero **iniciar sesión una vez y que quede guardada**, para arrancar la jornada aunque no haya señal.
- HU-02: Como **verificador**, quiero **configurar el lote** (plantel, campaña, galpón, corral, sexo, edad, línea, lote), para identificar y trazar lo que peso.
- HU-03: Como **verificador**, quiero **conectar mi báscula Bluetooth y registrar el peso automáticamente**, para no anotar en papel.
- HU-04: Como **verificador**, quiero **ver el peso frente al estándar del lote**, para saber al instante si está dentro de lo previsto.
- HU-05: Como **verificador**, quiero **evaluar la calidad de una muestra de aves** (opcional), para registrar lesiones y pigmentación en el mismo flujo.
- HU-06: Como **verificador**, quiero **seguir trabajando sin señal y que todo se sincronice solo al reconectar**, para no perder datos ni depender de la cobertura.
- HU-07: Como **verificador**, quiero **saber si todo se sincronizó**, para irme tranquilo al final del día.

**Web — Supervisión y calidad**
- HU-08: Como **supervisor**, quiero **registrar evaluaciones de calidad en cliente**, para digitalizar el control.
- HU-09: Como **supervisor**, quiero **ver indicadores, tendencias y rankings** filtrables, para tomar decisiones.
- HU-10: Como **supervisor/comercial**, quiero **ver el peso en vivo de todas las básculas**, para monitorear el avance del día.
- HU-11: Como **supervisor**, quiero **ver la trazabilidad del mismo lote de granja a cliente**, para cerrar el círculo de calidad.
- HU-12: Como **supervisor**, quiero **generar los formatos oficiales de calidad y exportar datos**, para reportería y Power BI.

**Administración**
- HU-13: Como **administrador**, quiero **administrar datos maestros y usuarios/roles**, para operar la herramienta sin intervención de TI.

## 6. Requisitos funcionales (RF)

### 6.1 Autenticación y usuarios
- **RF-01 (M):** El sistema debe autenticar por usuario y contraseña, con sesión por token y control de acceso por rol.
- **RF-02 (M):** El sistema debe restringir cada vista/acción según el rol del usuario.
- **RF-03 (M):** El administrador debe poder crear usuarios, asignar roles y **revocar/rotar el acceso móvil** (token) de un verificador.
- **RF-04 (S):** El sistema debe forzar cambio de contraseña inicial.

### 6.2 App móvil — Pesaje
- **RF-05 (M):** La app debe permitir configurar el lote a pesar (plantel, campaña, galpón, corral, categoría macho/hembra/mediano, edad, línea, lote, N° aves por pesada).
- **RF-06 (M):** La app debe conectarse a básculas por **Bluetooth clásico (SPP)** y registrar el peso automáticamente por lectura.
- **RF-07 (M):** La app debe **soportar múltiples marcas/protocolos de báscula** de forma extensible, sin cambiar la capa de conexión.
- **RF-08 (M):** La app debe mostrar el peso en vivo y compararlo contra la **tabla de pesos estándar** del lote.
- **RF-09 (S):** La app debe permitir **evaluar calidad por ave** de forma opcional (hematoma, defecto de selección, pododermatitis 0–2, rasguños 0–2, pigmentación 0–7).
- **RF-10 (M):** La app debe **funcionar sin conexión**: los registros se almacenan localmente y se **sincronizan automáticamente** al recuperar señal.
- **RF-11 (M):** La sincronización debe ser **idempotente** (no duplicar registros ante reenvíos).
- **RF-12 (M):** La app debe mostrar el **estado de sincronización** (pendientes / todo sincronizado).
- **RF-13 (S):** La app debe **cachear el catálogo** de planteles para configurar jornadas sin conexión.
- **RF-14 (S):** La app debe **alertar** sobre registros pendientes antiguos y sobre pendientes de otro verificador antes de sincronizar.
- **RF-15 (C):** La app debe ofrecer un **diagnóstico** de datos crudos (incl. hexadecimal) para incorporar marcas nuevas de báscula.

### 6.3 Web — Calidad, monitor y trazabilidad
- **RF-16 (M):** La web debe permitir **registrar evaluaciones de calidad en cliente** (selección, pigmentación, lesiones, hematomas, temperatura).
- **RF-17 (M):** La web debe mostrar un **dashboard de indicadores** (selección, hematomas, pigmentación, pododermatitis, rasguños, temperatura) con **filtros** (año, cliente, zona, mes, semana, día, y avanzados) y **tendencias/rankings**.
- **RF-18 (M):** La web debe mostrar un **monitor de pesaje en vivo** que se actualiza automáticamente.
- **RF-19 (M):** La web debe mostrar la **trazabilidad granja↔cliente** cruzando el mismo lote (campo `complex`).
- **RF-20 (S):** La web debe **generar los formatos oficiales de calidad en PDF**.
- **RF-21 (M):** La web debe **exportar datos en CSV** para alimentar Power BI.
- **RF-22 (M):** La web debe exponer una **API para la app móvil** (`/api/mobile/*`): login, catálogos, correlativo de ave, registros por lote y peso en vivo.

### 6.4 Administración de datos maestros
- **RF-23 (M):** La web debe permitir administrar **clientes, planteles, campañas y tabla de pesos estándar**.
- **RF-24 (S):** El sistema debe calcular en el **servidor** el identificador de cruce (`complex = Plantel-Campaña-Galpón-Categoría-Corral`).

## 7. Requisitos no funcionales (RNF)

### 7.1 Seguridad
- **RNF-01 (M):** Contraseñas almacenadas con hashing fuerte (bcrypt); nunca en texto plano.
- **RNF-02 (M):** Sesiones con token opaco; la API móvil exige token Bearer válido de usuario activo.
- **RNF-03 (M):** Comunicación sobre HTTPS con cabeceras de seguridad (HSTS, anti-clickjacking, no-sniff, referrer-policy, permisos de cámara/geolocalización restringidos).
- **RNF-04 (M — productización):** Integrable con **SSO / Active Directory** (Azure AD / LDAP) como proveedor de identidad corporativo.
- **RNF-05 (S):** Trazabilidad de autoría del dato (quién registró / quién sincronizó).

### 7.2 Disponibilidad de red y sincronización
- **RNF-06 (M):** La captura en granja debe operar **100 % offline** durante toda la jornada.
- **RNF-07 (M):** La sincronización debe reanudar sola tras cortes, reinicios del dispositivo y cierre de la app, con reintentos.
- **RNF-08 (M):** La sincronización no debe **duplicar** datos (idempotencia por identificador de cliente).

### 7.3 Rendimiento
- **RNF-09 (S):** El monitor de pesaje debe refrescar el peso en vivo en intervalos de ~2 s.
- **RNF-10 (S — productización):** Con base de datos administrada (SQL Server), las vistas de indicadores deben responder de forma fluida sobre el volumen histórico esperado.

### 7.4 Portabilidad y despliegue
- **RNF-11 (M):** La aplicación debe ser **agnóstica del motor de base de datos** (acceso vía ORM); soporta el cambio de SQLite a **SQL Server** por configuración/adaptador, sin reescritura. *(Validado en un spike sobre SQL Server real.)*
- **RNF-12 (M — productización):** Debe desplegarse como **contenedor Docker** en la infraestructura corporativa (nube u on-premise).
- **RNF-13 (S):** Debe soportar **ambientes separados** (demostración y producción).

### 7.5 Respaldo y continuidad
- **RNF-14 (M — productización):** La base de datos productiva debe tener **respaldos automáticos** y política de retención (a definir con TI).

### 7.6 Usabilidad y compatibilidad
- **RNF-15 (S):** Interfaz responsiva (web) y app Android (min. Android 7 / SDK 24).
- **RNF-16 (C):** Modo claro/oscuro.

### 7.7 Integración
- **RNF-17 (S):** Exportación compatible con **Power BI** (CSV; a futuro, workspace/gateway corporativo).
- **RNF-18 (W — fase futura):** Integración con **SAP**.

## 8. Reglas de negocio y modelo de datos

### 8.1 Reglas de negocio clave
- **RN-01:** El **número de ave** es correlativo por `plantel + campaña + galpón + corral + categoría`; se calcula siempre desde lo persistido (nunca un contador en memoria) para no duplicar ante cortes.
- **RN-02:** El **cruce granja↔cliente** usa `complex = Plantel-Campaña-Galpón-Categoría-Corral`, calculado por el servidor. La categoría `MEDIANO` no cruza contra calidad en cliente (esperado).
- **RN-03:** Grados de lesión: `0` sin lesión, `1` leve, `2` grave (G2). Pigmentación en escala `0–7`.
- **RN-04:** Cada registro móvil lleva un **UUID generado por el celular** antes de sincronizar (idempotencia).
- **RN-05:** El servidor atribuye el registro al **usuario autenticado al sincronizar**; si hay pendientes de otro verificador, se advierte antes de continuar.
- **RN-06:** La **hora de captura** (campo) se conserva independientemente de la hora de sincronización.

### 8.2 Entidades principales
- **Inspección / evaluación de calidad** (cliente): criterios de selección, pigmentación, lesiones, hematomas, temperatura, `complex`, verificador, fecha.
- **Registro de peso preventa** (granja): lote, categoría, N° ave, peso, calidad opcional por ave, `complex`, verificador, hora de captura, hora de sincronización.
- **Lectura de peso en vivo**: última lectura por verificador (para el monitor).
- **Peso estándar**: peso esperado por línea/sexo/edad (referencia).
- **Datos maestros**: usuarios/roles, clientes, planteles, campañas.

## 9. Criterios de aceptación (selección)

- **CA-01 (RF-06/08):** Al colocar un peso conocido en una báscula soportada, la app muestra el valor correcto (±tolerancia de la báscula) y lo compara con el estándar del lote.
- **CA-02 (RF-10/11/12):** Registrando N aves sin señal, el contador muestra N pendientes; al reconectar, suben todos, el estado pasa a "Todo sincronizado" y **no** hay duplicados en el servidor.
- **CA-03 (RF-05/13):** Es posible configurar e iniciar una jornada **sin conexión** usando el catálogo cacheado.
- **CA-04 (RF-11):** Reenviar el mismo lote de registros no genera duplicados en el servidor.
- **CA-05 (RF-19/RN-02):** Un lote pesado en granja y evaluado en cliente aparece cruzado en la vista de trazabilidad.
- **CA-06 (RF-17):** Los filtros del dashboard producen indicadores consistentes y las tendencias reflejan el período seleccionado.
- **CA-07 (RF-21):** La exportación CSV abre correctamente y contiene las columnas esperadas para Power BI.
- **CA-08 (RNF-11):** La aplicación funciona sobre SQL Server cambiando únicamente configuración/adaptador, sin cambios en la lógica de negocio.
- **CA-09 (RF-01/02/RNF-02):** Un usuario no puede acceder a vistas/acciones fuera de su rol; la API móvil rechaza peticiones sin token válido.

## 10. Dependencias, supuestos y riesgos

**Dependencias**
- Básculas con kit **Bluetooth clásico (SPP)** emparejables al dispositivo.
- Dispositivos Android para los verificadores.
- Para productización: instancia de **SQL Server**, proveedor de **identidad corporativa (SSO/AD)**, y **workspace de Power BI** de la organización.

**Supuestos**
- Los datos maestros (clientes, planteles, campañas) se administran en la herramienta en esta fase (sin integración SAP).
- La red móvil en granja puede ser intermitente o nula durante la jornada.

**Riesgos**
- **R1:** Básculas que solo expongan **BLE (GATT)** o protocolo propietario requieren soporte adicional de conexión. *(Mitigación: capa de protocolos extensible; validación por diagnóstico.)*
- **R2:** Marcas de báscula sin protocolo documentado. *(Mitigación: parser provisional + captura hex real / solicitud al fabricante.)*
- **R3:** Definiciones corporativas pendientes (SSO, SLA, respaldos, perfiles) pueden condicionar el despliegue. *(Mitigación: acordar con Arquitectura y Seguridad temprano.)*

## 11. Fases / roadmap

| Fase | Contenido | Estado |
|---|---|---|
| **Fase 1 — Solución funcional** | Calidad web + pesaje móvil, offline/sincronización, monitor, trazabilidad, indicadores, reportes, catálogos | **Construida y operativa (demo)** |
| **Fase 2 — Productización corporativa** | Migración a SQL Server, SSO/Active Directory, despliegue Docker corporativo, respaldos/SLA, Power BI corporativo | Pendiente (requisitos en este PRD) |
| **Fase 3 — Integraciones y evolución** | Integración con SAP, mejoras de básculas (BLE/marcas nuevas), optimizaciones | Futuro |

---

*Documento vivo. Los cambios de alcance o requisitos se registran incrementando la versión en la cabecera. Marca del sistema: "Sistema de Calidad y Pesaje" (genérica).*

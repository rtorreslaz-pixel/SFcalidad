# Contrato de integración — App de Calidad (web) ↔ Bluetooth Scale App (Android)

Fuente de verdad compartida entre las dos conversaciones de desarrollo. Ambas apps
viven en este mismo repositorio y comparten la **misma base de datos**.

> **Si cambias algo de este contrato, actualiza este documento en el mismo commit.**

## 1. Reparto de responsabilidades

| Área | Dueño |
|------|-------|
| UI web, dashboards, BI, reportes, formatos, preventa/engranaje | **Web** (conversación `poultry-quality-inspection`) |
| Esquema Prisma y **todas** las migraciones | **Web** (dueño único de la BD) |
| Lado **servidor** de `/api/mobile/*` | **Web** |
| Export / conexión BI | **Web** |
| App Android (`android-scale-prototype/`), balanza Bluetooth, UI móvil | **Android** (conversación `bluetooth-scale-app`) |
| Lado **cliente** de `/api/mobile/*` | **Android** |

**Superficie compartida que hay que coordinar:** el contrato `/api/mobile/*` y el esquema de BD.

## 2. Flujo de ramas

- Web: `claude/poultry-quality-inspection-chbub6`
- Android: `claude/bluetooth-scale-app-zzkjio`
- Cada conversación trabaja en su rama. **La integración (fetch + merge) la lidera Web.**
  Cuando Android llegue a un punto estable, Web hace el merge hacia su rama.

## 3. Reglas de cambio

1. **Todo cambio de esquema/migración pasa por Web.** Si Android necesita un campo nuevo,
   lo solicita y Web lo agrega + migra. Nunca crear migraciones desde la rama Android
   (evita migraciones en conflicto sobre la misma BD).
2. **El contrato `/api/mobile/*` no se rompe sin aviso.** Los cambios deben ser
   retrocompatibles o coordinarse explícitamente entre ambas conversaciones.
3. **Los campos que alimentan el BI/export no se renombran.**

## 4. Autenticación

Las rutas móviles (salvo `auth`) exigen el header:

```
Authorization: Bearer <apiToken>
```

- El `apiToken` se obtiene en `POST /api/mobile/auth` y se valida con `requireMobileUser()`
  (`src/lib/auth.ts`): busca el `User` por `apiToken`, que debe estar `activo`.
- El token es `randomBytes(32).base64url`, único por usuario (`User.apiToken @unique`).
- Se emite de forma perezosa: si el usuario aún no tiene token, el primer `auth` lo crea.
- El admin puede **rotar/revocar** el token desde `admin/usuarios` (al revocar, el celular
  queda 401 y debe re-autenticarse).
- No hay restricción de rol en las rutas móviles: basta un usuario activo con token válido.

## 5. Endpoints

### `POST /api/mobile/auth`
Login para obtener el token. **No** requiere Bearer.

Request:
```json
{ "email": "verificador1@avicola.com", "password": "..." }
```
Response `200`:
```json
{ "token": "<apiToken>", "user": { "id": "...", "nombre": "...", "email": "..." } }
```
Errores: `400` faltan campos · `401` credenciales inválidas o usuario inactivo.

### `GET /api/mobile/catalogos`
Catálogo de planteles para la captura en campo. Requiere Bearer.

Response `200`:
```json
{ "planteles": [ { "id": "...", "codigo": "P006", "nombre": "...", "cliente": "AKIM" } ] }
```
`cliente` y `nombre` pueden ser `null`.

### `GET /api/mobile/numero-ave-max`
Devuelve el mayor `numeroAve` ya sincronizado para un corral concreto. El celular lo usa
como piso para su contador local (que se pierde si se reinstala la app). Requiere Bearer.

Query (todos obligatorios): `plantelId`, `campania`, `galpon`, `corral`, `categoria`.

Response `200`:
```json
{ "maxNumeroAve": 142 }
```
`maxNumeroAve` es `null` si no hay registros aún. Errores: `400` parámetros inválidos.

### `POST /api/mobile/live-weight`
Publica el **peso en vivo** (última lectura de balanza) del verificador, para el dashboard
de preventa en tiempo real. Upsert **único por verificador** (`LiveWeightReading`, PK =
`verificadorId`): solo se conserva la última lectura. Requiere Bearer.

Request:
```json
{
  "pesoGramos": 2310.5,
  "categoria": "MACHO",
  "plantelCodigo": "P006",
  "campania": "C1",
  "galpon": "12",
  "corral": "A"
}
```
Solo `pesoGramos` (number finito) es obligatorio; el resto es opcional/nullable.
Response `200`: `{ "ok": true }`. Errores: `400` `pesoGramos` inválido.

### `POST /api/mobile/registros`
Sincroniza por lotes los registros de peso por ave (`RegistroPesoPreventa`). Requiere Bearer.

Request:
```json
{
  "registros": [
    {
      "id": "uuid-v4-generado-en-el-celular",
      "plantelId": "...",
      "campania": "C1",
      "galpon": "12",
      "corral": "A",
      "categoria": "MACHO",
      "numeroAve": 143,
      "pesoGramos": 2305.0,
      "fechaHora": "2026-06-28T13:40:00.000Z",
      "tieneHematoma": false,
      "tieneDefectoSeleccion": false,
      "gradoPododermatitis": 0,
      "gradoRasguno": 1,
      "pigmentacion": 4,
      "edad": 42,
      "linea": "Ross",
      "lote": "J",
      "nAvesPorPesada": 1
    }
  ]
}
```

Reglas de cada registro:
- `id`: **UUID generado por el celular ANTES de sincronizar** (idempotencia). El upsert usa
  `update: {}`, es decir **inserta una sola vez**: reenviar el mismo `id` NO modifica la fila
  existente. A futuro: si Android necesita corregir un registro ya sincronizado, requiere
  un endpoint nuevo — hoy no se puede editar vía reenvío.
- `plantelId`: debe existir (si alguno no existe → `400`, no se ingiere nada).
- `categoria`: `MACHO` | `HEMBRA` | `MEDIANO`.
- `numeroAve`, `pesoGramos`: number.
- `fechaHora`: ISO-8601 parseable (hora de captura en campo, no de sync).
- `tieneHematoma`, `tieneDefectoSeleccion`: boolean | null.
- `gradoPododermatitis`, `gradoRasguno`: `0` | `1` | `2` | null (0 sin lesión, 1 leve, 2 grave).
- `pigmentacion`: entero `0`–`7` | null.
- `campania`: string | null.
- `edad`: entero ≥ 0 | null — días de vida del lote al momento de la pesada.
- `linea`: string | null — línea genética (ej. `"Ross"`, `"Cobb"`).
- `lote`: string | null — clasificación del lote (`"J"` Joven / `"A"` Adulto).
- `nAvesPorPesada`: entero > 0 | null — N° aves pesadas juntas por lectura de báscula.

Response `200`:
```json
{ "ingested": 1, "ids": ["uuid-v4-generado-en-el-celular"] }
```
Errores: `400` arreglo vacío, registro con campos inválidos, o `plantelId` inexistente.
El `complex` (`Plantel-Campaña-Galpón-Categoría-Corral`) lo calcula el **servidor**; el
celular no lo envía.

## 6. Modelos de BD compartidos

Definidos en `prisma/schema.prisma`. **No editar desde la rama Android.**

### `RegistroPesoPreventa`
Registro por ave pesada en granja. Campos clave: `id` (UUID de cliente, **sin** `@default`),
`plantelId`, `campania?`, `galpon`, `corral`, `categoria`, `numeroAve`, `pesoGramos`,
`fechaHora` (captura), `complex?`, `tipoMuestreo` (`PREVENTA` por defecto), metadatos del
lote opcionales (`edad?`, `linea?`, `lote?`, `nAvesPorPesada?`), criterios de calidad
opcionales por ave (`tieneHematoma?`, `tieneDefectoSeleccion?`, `gradoPododermatitis?`,
`gradoRasguno?`, `pigmentacion?`), `verificadorId`, `syncedAt`, `createdAt`.
Índices: `[plantelId, galpon, corral, categoria]`, `[verificadorId, fechaHora]`.

### `LiveWeightReading`
Última lectura de balanza por verificador. PK = `verificadorId` (una fila por usuario):
`pesoGramos`, `plantelCodigo?`, `campania?`, `galpon?`, `corral?`, `categoria?`, `complex?`,
`updatedAt`.

### `User.apiToken`
`String? @unique` — token Bearer del usuario para la API móvil.

### Enums
- `CategoriaAve`: `MACHO` | `HEMBRA` | `MEDIANO` (la app de calidad usa `SexoAve` = `MACHO`|`HEMBRA`).
- `TipoMuestreo`: `PREVENTA` | `CALIDAD` (`CALIDAD` reservado, no usado aún).

## 7. Cruce calidad granja ↔ calidad cliente (`complex`)

`buildComplexEntity()` (`src/lib/complex-entity.ts`) arma `Plantel-Campaña-Galpón-Categoría-Corral`,
mismo formato que `Inspeccion.complex`, para comparar el peso/calidad medido en granja contra
las evaluaciones de calidad del cliente del mismo lote (dashboard **engranaje**).

⚠️ `MEDIANO` se abrevia `MD` y **no** tiene equivalente en `SexoAve`, así que esos registros de
preventa no cruzan contra ninguna `Inspeccion.complex` — es esperado.

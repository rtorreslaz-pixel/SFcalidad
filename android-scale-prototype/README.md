# SF Pesaje Granja — app Android de pesaje preventa

App Android nativa (Kotlin) para el **pesaje preventa en granja** con báscula Bluetooth:
el verificador se loguea, configura el lote (plantel, campaña, galpón, corral, categoría),
conecta la báscula y registra el peso ave por ave (con evaluación de calidad opcional).
Funciona **offline**: los registros se guardan en el teléfono y se sincronizan solos con
el servidor cuando hay señal. Comparte base de datos y contrato de API con la app web
(ver `../INTEGRATION.md`).

Las básculas con kit Bluetooth usan **Bluetooth clásico, perfil serie (SPP)**, no BLE.
Por eso esta app es nativa y no funciona desde el navegador.

## Ambientes y APK

- El **APK debug** apunta al ambiente **demo** (`sfcalidemo.up.railway.app`, datos de
  prueba). Login de prueba: `verificador1@avicola.com` / `demo1234`.
- El **APK release** apunta a **producción** (`sfcaliprod.up.railway.app`).
- CI (workflow "Android APK") corre los tests y publica `app-debug.apk` como artefacto
  descargable en cada push que toque esta carpeta: GitHub → Actions → run más reciente
  → Artifacts → `bit-scale-app-debug`.

## Cómo compilarla y correrla

Con Android Studio (recomendado):
1. Abre la carpeta `android-scale-prototype/` como proyecto (no la raíz del repo).
2. Corre ▶ el módulo `app` en un emulador o en un teléfono por USB con "Depuración USB".
   - En **emulador** todo funciona salvo el Bluetooth real (limitación de Android);
     útil para UI, login, catálogos y ver la base local con el Database Inspector.
   - La **conexión a báscula** solo se prueba con teléfono físico: empareja la báscula
     antes desde Ajustes > Bluetooth del teléfono y enciéndela en modo salida continua.

Por línea de comandos (con el SDK de Android y el teléfono conectado):
```
./gradlew installDebug
adb shell am start -n com.rommel.scaleprototype/.MainActivity
```
Tests unitarios (parsers de básculas, DTOs, DAO): `./gradlew testDebugUnitTest`

## Qué hace

- **Login** contra `/api/mobile/auth` (token Bearer, se guarda en el teléfono).
- **Configuración de captura**: plantel (catálogo descargado del servidor), campaña,
  galpón, corral, categoría, edad, línea, lote y N° de aves por pesada.
- **Captura**: peso en vivo de la báscula conectada, registro por ave con número
  correlativo, y evaluación de calidad opcional por ave (hematoma, defecto de selección,
  pododermatitis, rasguño, pigmentación).
- **Cola offline** (Room, `scale-prototype.db`): cada registro queda local con
  `synced=false`; un worker los sube por lotes a `/api/mobile/registros` (idempotente
  por UUID) y publica el peso en vivo a `/api/mobile/live-weight` para el monitor web.
  El catálogo de planteles se cachea para poder configurar la jornada sin señal, y el
  badge de la pantalla de captura confirma el cierre del ciclo ("✓ Todo sincronizado").
- **Alertas operativas**: aviso al entrar si hay registros sin subir hace más de 12 h
  (la única copia vive en el teléfono), y advertencia en el login si hay pendientes de
  OTRO verificador (el servidor los atribuiría a quien esté logueado al subirlos).
- **Diagnóstico Bluetooth**: muestra cada línea cruda que envía la báscula (y su
  versión en hexadecimal) — es la herramienta para capturar el formato real de una
  báscula nueva y afinar su parser. Botón "Copiar registro" para compartir el log.

## Arquitectura: para soportar otras marcas de báscula

El proyecto está dividido a propósito en dos capas independientes:

- **Conexión (`ScaleBluetoothClient.kt`)**: abre el socket Bluetooth SPP y entrega
  líneas de texto crudas. Es genérico — casi todas las básculas de mesa/industriales con
  kit Bluetooth (Ohaus, A&D, Adam Equipment, CAS, Mettler Toledo, T-Scale, etc.) usan
  este mecanismo, porque el Bluetooth ahí solo reemplaza el cable RS232. Esta capa no
  cambia al cambiar de marca.
- **Decodificación (`ScaleProtocol.kt` + implementaciones)**: cada marca/formato tiene su
  clase con su `parse()`. Todas devuelven el peso **siempre en kg** (contrato que asume
  `CaptureFragment`). Protocolos actuales, en el orden del spinner:
  1. `OhausRangerProtocol` (por defecto) — formato real de salida continua de la
     Ohaus Ranger 3000, tomado del manual oficial (sección "Output Format").
  2. `GenericRegexProtocol` — heurística genérica (primer número con signo + unidad),
     respaldo para básculas de formato desconocido.
  3. `TScaleBwProtocol` — trama binaria "Con2" de los indicadores T-Scale BW/BWS/CW/VW,
     según manual técnico oficial.
  4. `BitPs40Protocol` — Bröring BIT PS 4.0 IoT, **provisional**: el fabricante no
     publica la trama Bluetooth, así que aplica una heurística estricta (coma decimal
     alemana, preferencia por número con unidad, enteros ≥50 como gramos, descarte de
     horas/fechas/series). Validar con la báscula física en "Diagnóstico Bluetooth" y
     ajustar con una captura real (o pedir el protocolo a appstore@broeringtech.com).

  Para agregar una báscula nueva:
  1. Crear una clase `MiBasculaProtocol : ScaleProtocol` con su propio `parse()` + test.
  2. Agregarla **al final** de la lista en `ScaleProtocols.kt` (el índice elegido se
     persiste en el teléfono; insertar en el medio cambiaría la selección recordada).
  3. Aparece automáticamente en el spinner — no se toca la conexión Bluetooth.

Excepciones si en campo aparecen básculas de otro tipo:
- **Básculas BLE** (no clásicas): necesitan otra clase de conexión (GATT en vez de
  RFCOMM); el patrón de protocolos intercambiables sigue aplicando igual.
- **Básculas que emulan teclado Bluetooth (HID)**: no pasan por este código — "escriben"
  el número donde esté el cursor; sin evento de "lectura estable".

## Base de datos local (Room)

Una tabla, `registro_peso` (esquema v4, migraciones reales — nunca destructivas para no
perder la cola de un verificador). Ver `data/RegistroPeso.kt` y los esquemas exportados
en `app/schemas/`. Del lado del servidor alimenta `RegistroPesoPreventa` (permanente),
`LiveWeightReading` (última lectura por verificador) y consume `PesoEstandar` (tabla de
referencia Ross 308). Detalle completo del contrato en `../INTEGRATION.md`.

# Prueba de conectividad Bluetooth – Báscula Ranger R31P30

App Android nativa (Kotlin) independiente del proyecto Next.js, solo para validar la
conexión Bluetooth con la báscula antes de integrarla a la app principal.

La Ranger 3000 (R31P30) con kit BT usa **Bluetooth clásico, perfil serie (SPP)**, no BLE.
Por eso esta prueba es una app nativa y no funciona desde el navegador.

## Requisitos previos

1. Empareja la báscula con el Samsung A20 desde **Ajustes > Bluetooth** del propio
   Android (la app solo lista dispositivos ya emparejados; el botón "Ajustes Bluetooth"
   dentro de la app abre esa pantalla directamente).
2. Enciende la báscula en modo de salida continua (revisa el menú de la Ranger).

## Cómo compilarla y correrla

Con Android Studio (recomendado):
1. Abre la carpeta `android-scale-prototype/` como proyecto.
2. Conecta el A20 por USB con "Depuración USB" activada.
3. Run ▶ sobre el módulo `app`.

Por línea de comandos (con el SDK de Android instalado y el teléfono conectado):
```
./gradlew installDebug
adb shell am start -n com.rommel.scaleprototype/.MainActivity
```

## Qué hace

- Lista los dispositivos Bluetooth ya emparejados.
- Al conectar, abre un socket RFCOMM (SPP) y muestra **cada línea cruda** que envía
  la báscula en el log de la pantalla.
- Spinner "Protocolo / marca de báscula": decodifica el peso usando el protocolo
  elegido (ver siguiente sección — así se soportan varias marcas sin tocar la conexión).
- Casilla "Mostrar también en hexadecimal": útil si el texto se ve raro (caracteres no
  imprimibles, codificación distinta, etc).
- Botón "Copiar registro": copia todo el log crudo al portapapeles para compartirlo y
  así afinar el parser con datos reales.

## Arquitectura: para soportar otras marcas de báscula en el futuro

El proyecto está dividido a propósito en dos capas independientes:

- **Conexión (`ScaleBluetoothClient.kt`)**: abre el socket Bluetooth SPP y entrega
  líneas de texto crudas. Es genérico — casi todas las básculas de mesa/industriales con
  kit Bluetooth (Ohaus, A&D, Adam Equipment, CAS, Mettler Toledo, etc.) usan este mismo
  mecanismo, porque el Bluetooth ahí solo reemplaza el cable RS232. Esta capa no cambia
  al cambiar de marca.
- **Decodificación (`ScaleProtocol.kt` + implementaciones)**: cada marca/formato de texto
  tiene su propia clase que implementa la interfaz `ScaleProtocol`. Hoy solo existe
  `GenericRegexProtocol` (heurística: toma el primer número con signo de la línea).
  Para agregar una báscula nueva con un formato distinto:
  1. Crear una clase `MiBasculaProtocol : ScaleProtocol` con su propio `parse()`.
  2. Agregarla a la lista en `ScaleProtocols.kt`.
  3. Aparece automáticamente en el spinner de la UI — no se toca la conexión Bluetooth.

Excepciones a tener en cuenta si en campo aparecen básculas de otro tipo:
- **Básculas BLE** (no clásicas): necesitan otra clase de conexión (GATT en vez de
  RFCOMM); el patrón de protocolos intercambiables sigue aplicando igual.
- **Básculas que emulan teclado Bluetooth (HID)**: no pasan por este código en absoluto,
  "escriben" el número donde esté el cursor — no necesitan parser propio, pero tampoco
  dan tanto control (sin evento de "lectura estable").

## Próximo paso

Una vez confirmada la conexión y el formato real de los datos de la Ranger, falta decidir
cómo integrarlo al proyecto principal (Next.js): lo más directo es envolver la app web
con Capacitor y un plugin de Bluetooth Serial, reutilizando esta misma lógica de conexión
y protocolos.

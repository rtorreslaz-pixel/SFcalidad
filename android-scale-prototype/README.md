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
  Por defecto viene seleccionado el protocolo real de la Ranger 3000 (ver abajo).
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
  tiene su propia clase que implementa la interfaz `ScaleProtocol`. Hoy existen dos:
  - `OhausRangerProtocol` (seleccionado por defecto): implementa el formato real de salida
    RS232/continua de la Ranger 3000, tomado del manual oficial de Ohaus (sección "Output
    Format"). Cada línea trae, separados por un espacio: el peso (campo de 9 caracteres,
    justificado a la derecha, con el signo pegado al primer dígito si es negativo), la
    unidad (campo de 5 caracteres, justificado a la izquierda: `kg`, `g`, `lb`, `oz` o
    `lb:oz`), opcionalmente `?` si el peso todavía no está estable, y opcionalmente `NET` o
    `G` si la línea corresponde a peso neto o bruto. El terminador de línea depende del menú
    `FEED` de la báscula (normalmente CR/LF). El kit Bluetooth de la Ranger no cambia nada de
    esto: solo reemplaza el cable RS232 por el socket SPP, la trama que llega es idéntica
    (el manual de la Ranger no menciona el kit BT porque es un accesorio transparente a nivel
    de protocolo).
  - `GenericRegexProtocol`: heurística genérica (toma el primer número con signo de la
    línea), útil como respaldo si en campo aparece una báscula de otra marca con formato
    desconocido, mientras se le agrega su protocolo específico.

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

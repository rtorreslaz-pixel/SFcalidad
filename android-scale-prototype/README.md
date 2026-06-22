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
- Intenta extraer un peso de cada línea (heurístico: toma el primer número con signo
  que encuentra, y la unidad si la reconoce). Esto es temporal — en cuanto tengamos
  capturado el formato real que usa tu Ranger, hay que ajustar la expresión regular en
  `WeightParser.kt` para que sea exacta.
- Casilla "Mostrar también en hexadecimal": útil si el texto se ve raro (caracteres no
  imprimibles, codificación distinta, etc).
- Botón "Copiar registro": copia todo el log crudo al portapapeles para compartirlo y
  así afinar el parser con datos reales.

## Próximo paso

Una vez confirmada la conexión y el formato real de los datos, falta decidir cómo
integrarlo al proyecto principal (Next.js): lo más directo es envolver la app web con
Capacitor y un plugin de Bluetooth Serial, reutilizando esta misma lógica de conexión.

# Guía de prueba — SF Pesaje Granja (app Android)

Guía para probar la app de pesaje preventa en campo o en oficina. Versión de
referencia: **1.5 (alertas)** — verificar en Ajustes → Aplicaciones → SF Pesaje Granja.

## 1. Obtener e instalar el APK

1. GitHub → repositorio `SFcalidad` → pestaña **Actions** → workflow **"Android APK"**
   → el run **más reciente** en verde → sección **Artifacts** → descargar
   **`bit-scale-app-debug`** (zip con `app-debug.apk`).
2. En el teléfono: desinstalar cualquier versión anterior → instalar el APK
   (permitir "instalar apps de origen desconocido").

> El APK de prueba apunta al **ambiente demo** (datos de prueba, banner amarillo en la
> web). No toca datos reales — se puede registrar sin miedo.

## 2. Credenciales de prueba

| Usuario | Contraseña |
|---|---|
| `verificador1@avicola.com` (…hasta `verificador10@…`) | `demo1234` |

La web del mismo ambiente (para ver los datos llegar): `https://sfcalidemo.up.railway.app`
(`supervisor@avicola.com` / `demo1234`).

## 3. Checklist de prueba

### Sin báscula (cualquier teléfono)
- [ ] Login entra y muestra la pantalla de configuración.
- [ ] El spinner de **Plantel** se llena con el catálogo.
- [ ] En la pantalla de captura, el selector **"Protocolo / marca de báscula"** lista 4
      opciones y la última es **"BIT PS 4.0 IoT (Bröring, provisional)"**.
- [ ] **Prueba offline:** con el catálogo ya cargado una vez, activar modo avión →
      cerrar y abrir la app → debe poder configurarse la jornada igual (aviso
      *"usando el catálogo guardado"*).

### Con báscula Bluetooth
1. Emparejar la báscula desde Ajustes > Bluetooth del teléfono (la app solo lista
   dispositivos ya emparejados) y encenderla en modo de salida continua.
2. En la app, elegir el protocolo de la marca (para la BIT PS 4.0: la entrada
   "provisional").
- [ ] El peso en vivo aparece y coincide con el display de la báscula.
- [ ] "Registrar ave" guarda el registro y avanza el correlativo.
- [ ] **Si el peso NO aparece o se ve mal** (caso esperado con la BIT PS, cuyo
      protocolo no está publicado): abrir **"Diagnóstico Bluetooth"**, marcar la
      casilla **"hex"**, poner un peso conocido (p. ej. 2 kg exactos), y usar
      **"Copiar registro"** para enviar el log al equipo de desarrollo. Con esa
      captura se ajusta el parser al formato real.

### Sincronización (el corazón del flujo offline)
- [ ] Registrar varias aves **sin internet** (modo avión): el contador muestra
      "N pendientes de sincronizar".
- [ ] Reactivar internet: en segundos el contador baja hasta **"✓ Todo sincronizado"**.
- [ ] En la web demo (Monitor de pesaje / dashboards) aparecen los registros con su
      **hora de captura** original, no la de subida.
- [ ] **Alertas**: si quedan registros sin subir por más de 12 h, al entrar aparece la
      alerta de pendientes; si otro usuario inicia sesión con pendientes ajenos, el
      login advierte que se atribuirán a su nombre.

## 4. Qué reportar

Para cualquier problema, enviar: pantalla donde ocurrió, captura de pantalla, versión
de la app (Ajustes → Aplicaciones), y si es de báscula, el **log del Diagnóstico
Bluetooth en hex**.

## 5. Referencias

- `BD-Pesaje-diccionario-y-datos-de-prueba.xlsx` (en esta carpeta): diccionario de
  datos completo del pesaje (tabla del celular y tablas del servidor) con filas de
  ejemplo — útil para validar que los campos capturados son los correctos.
- `../android-scale-prototype/README.md`: documentación técnica de la app.
- `../INTEGRATION.md`: contrato de la API móvil.

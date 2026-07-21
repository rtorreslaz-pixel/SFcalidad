package com.rommel.scaleprototype

import android.bluetooth.BluetoothDevice
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/**
 * Mantiene UNA sola conexión Bluetooth a la báscula, viva durante toda la sesión y
 * compartida entre pantallas (Ajustes de báscula y Captura).
 *
 * Antes cada Fragment abría y cerraba su propio socket al navegar; como la BIT PS 4.0 admite
 * una sola conexión a la vez, la reconexión al cambiar de pantalla fallaba (socket timeout) y
 * el peso no aparecía al pasar a pesar. Aquí la báscula se conecta una vez y la conexión NO se
 * corta al navegar: al volver a pesar el peso llega de inmediato, y queda conectada para el
 * siguiente lote hasta que se desconecte explícitamente.
 *
 * Los Fragment se suscriben con [addListener] mientras están visibles y consultan [state] para
 * pintar el estado inicial. Los eventos se entregan siempre en el hilo principal.
 */
object ScaleConnectionManager {

    enum class State { DISCONNECTED, CONNECTING, CONNECTED }

    // Scope de aplicación (no atado a un Fragment): la lectura sigue viva entre pantallas.
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var client: ScaleBluetoothClient? = null

    // Cada conexión lleva un número de generación; los eventos tardíos de un cliente anterior
    // (p. ej. su "Disconnected" al cambiar de báscula) se ignoran para no pisar el estado nuevo.
    private var generation = 0

    @Volatile
    var state: State = State.DISCONNECTED
        private set

    /** Dirección MAC de la báscula conectada (o en proceso de conexión). */
    @Volatile
    var connectedAddress: String? = null
        private set

    /** Índice de protocolo elegido en Ajustes de báscula, para que Captura parsee igual. */
    @Volatile
    var protocolIndex: Int = -1
        private set

    private val listeners = LinkedHashSet<(ScaleEvent) -> Unit>()

    fun addListener(listener: (ScaleEvent) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (ScaleEvent) -> Unit) {
        listeners.remove(listener)
    }

    fun isConnected(): Boolean = state == State.CONNECTED

    /**
     * Conecta a [device]. Si ya está conectado (o conectando) a esa misma báscula, no hace nada:
     * mantiene la conexión viva. Cambiar de báscula sí reconecta.
     */
    fun connect(device: BluetoothDevice, protocolIndex: Int) {
        this.protocolIndex = protocolIndex
        if (state != State.DISCONNECTED && connectedAddress == device.address) return
        client?.disconnect()
        val gen = ++generation
        connectedAddress = device.address
        state = State.CONNECTING
        client = ScaleBluetoothClient(scope) { event -> onEvent(gen, event) }
        client?.connect(device)
    }

    fun disconnect() {
        client?.disconnect()
        client = null
        connectedAddress = null
        state = State.DISCONNECTED
    }

    private fun onEvent(gen: Int, event: ScaleEvent) {
        if (gen != generation) return // evento de un cliente anterior ya reemplazado
        when (event) {
            is ScaleEvent.Connected -> state = State.CONNECTED
            is ScaleEvent.Disconnected -> {
                state = State.DISCONNECTED
                connectedAddress = null
            }
            else -> {} // Status / Error / RawLine no cambian el estado de conexión
        }
        mainHandler.post { listeners.toList().forEach { it(event) } }
    }
}

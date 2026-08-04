package com.rommel.scaleprototype

import android.bluetooth.BluetoothDevice
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

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
 * Además de la conexión, este objeto es el **único dueño del protocolo** con el que se
 * interpretan las tramas. Antes Ajustes leía su desplegable en vivo y Captura usaba el valor
 * congelado al conectar: si se cambiaba el protocolo DESPUÉS de conectar (que es justo cómo se
 * encuentra el correcto), Ajustes mostraba el peso bien y al ir a pesar quedaba en "-- kg".
 * Ahora el desplegable *fija* el protocolo aquí con [setProtocol] y todas las pantallas leen
 * de un mismo sitio.
 *
 * Y como respaldo de campo: si llegan tramas que el protocolo elegido no entiende, se adopta
 * solo el que sí las entiende ([DeteccionProtocolo]); y si el socket queda vivo pero mudo —o
 * la báscula se cae— se reconecta sin intervención.
 *
 * Los Fragment se suscriben con [addListener] mientras están visibles y consultan [state] para
 * pintar el estado inicial. Los eventos se entregan siempre en el hilo principal.
 */
object ScaleConnectionManager {

    enum class State { DISCONNECTED, CONNECTING, CONNECTED }

    /** Silencio tras el cual se da por muerta la conexión y se reintenta. */
    private const val SIN_DATOS_PARA_RECONECTAR_MS = 15_000L
    private const val INTERVALO_VIGILANCIA_MS = 3_000L

    // Scope de aplicación (no atado a un Fragment): la lectura sigue viva entre pantallas.
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var client: ScaleBluetoothClient? = null

    /** Báscula objetivo; se conserva para poder reconectar sola. Null = desconexión pedida. */
    private var device: BluetoothDevice? = null
    private var vigilanciaJob: Job? = null

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

    /** Protocolo en uso. Lo fija Ajustes de báscula y lo leen TODAS las pantallas. */
    @Volatile
    var protocolIndex: Int = -1
        private set

    // Reloj monótono: instante de la última línea recibida (0 = ninguna todavía) y del último
    // intento de conexión, que le da a una conexión recién abierta su margen antes de juzgarla.
    @Volatile
    private var ultimaLineaEn: Long = 0L

    @Volatile
    private var ultimoIntentoEn: Long = 0L

    // Líneas recientes + racha sin interpretar, para decidir si el protocolo es el equivocado.
    private val ultimasLineas = ArrayList<String>()
    private var lineasSinInterpretar = 0

    private val listeners = LinkedHashSet<(ScaleEvent) -> Unit>()

    fun addListener(listener: (ScaleEvent) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (ScaleEvent) -> Unit) {
        listeners.remove(listener)
    }

    fun isConnected(): Boolean = state == State.CONNECTED

    /** Protocolo con el que hay que interpretar las tramas (null si no hay ninguno elegido). */
    fun protocoloActual(): ScaleProtocol? = ScaleProtocols.all.getOrNull(protocolIndex)

    /**
     * Milisegundos desde la última línea recibida; [Long.MAX_VALUE] si no llegó ninguna.
     * La usa la pantalla de pesaje para distinguir "no llega nada" de "llega y no se entiende".
     */
    fun millisSinDatos(): Long =
        if (ultimaLineaEn == 0L) Long.MAX_VALUE else SystemClock.elapsedRealtime() - ultimaLineaEn

    /**
     * Cambia el protocolo SIN tocar la conexión. Es lo que hace el desplegable de Ajustes de
     * báscula: aplica al instante y en todas las pantallas, sin obligar a reconectar.
     */
    fun setProtocol(index: Int) {
        if (index !in ScaleProtocols.all.indices || index == protocolIndex) return
        protocolIndex = index
        synchronized(ultimasLineas) { lineasSinInterpretar = 0 }
    }

    /**
     * Conecta a [device]. Si ya está conectado (o conectando) a esa misma báscula, no hace nada:
     * mantiene la conexión viva. Cambiar de báscula sí reconecta.
     */
    fun connect(device: BluetoothDevice, protocolIndex: Int) {
        // Solo pisa el protocolo si viene uno válido: Captura llama con -1 cuando no hay nada
        // guardado, y antes eso borraba el protocolo bueno que acababa de fijar Ajustes.
        if (protocolIndex in ScaleProtocols.all.indices) this.protocolIndex = protocolIndex
        if (state != State.DISCONNECTED && connectedAddress == device.address) return
        abrirConexion(device)
        iniciarVigilancia()
    }

    fun disconnect() {
        vigilanciaJob?.cancel()
        vigilanciaJob = null
        client?.disconnect()
        client = null
        device = null
        connectedAddress = null
        state = State.DISCONNECTED
        ultimaLineaEn = 0L
        ultimoIntentoEn = 0L
    }

    private fun abrirConexion(device: BluetoothDevice) {
        client?.disconnect()
        val gen = ++generation
        this.device = device
        connectedAddress = device.address
        state = State.CONNECTING
        ultimoIntentoEn = SystemClock.elapsedRealtime()
        client = ScaleBluetoothClient(scope) { event -> onEvent(gen, event) }
        client?.connect(device)
    }

    /**
     * Vigilancia de la conexión: un socket Bluetooth puede quedar abierto y mudo (la lectura se
     * bloquea para siempre sin lanzar error), y ahí la app se queda diciendo "Conectado" sin
     * recibir un solo peso. Se reintenta sola en vez de esperar a que alguien lo note.
     */
    private fun iniciarVigilancia() {
        if (vigilanciaJob?.isActive == true) return
        vigilanciaJob = scope.launch {
            while (isActive) {
                delay(INTERVALO_VIGILANCIA_MS)
                val objetivo = device ?: continue
                val silencio = SystemClock.elapsedRealtime() - maxOf(ultimaLineaEn, ultimoIntentoEn)
                val hayQueReintentar = when (state) {
                    // Vivo pero mudo: el socket quedó medio caído.
                    State.CONNECTED -> silencio > SIN_DATOS_PARA_RECONECTAR_MS
                    // Se cayó sola (báscula apagada, fuera de alcance): se reintenta hasta lograrlo.
                    State.DISCONNECTED -> silencio > SIN_DATOS_PARA_RECONECTAR_MS
                    State.CONNECTING -> false
                }
                if (hayQueReintentar) {
                    emitir(ScaleEvent.Status("Sin datos de la báscula: reconectando…"))
                    abrirConexion(objetivo)
                }
            }
        }
    }

    private fun onEvent(gen: Int, event: ScaleEvent) {
        if (gen != generation) return // evento de un cliente anterior ya reemplazado
        when (event) {
            is ScaleEvent.Connected -> state = State.CONNECTED
            is ScaleEvent.Disconnected -> {
                state = State.DISCONNECTED
                connectedAddress = null
            }
            is ScaleEvent.RawLine -> registrarLinea(event.text)
            else -> {} // Status / Error no cambian el estado de conexión
        }
        emitir(event)
    }

    private fun emitir(event: ScaleEvent) {
        mainHandler.post { listeners.toList().forEach { it(event) } }
    }

    /**
     * Anota la línea y vigila que el protocolo elegido la esté entendiendo. Si acumula varias
     * seguidas sin interpretar y otro protocolo sí las lee, se cambia solo y se avisa.
     */
    private fun registrarLinea(texto: String) {
        ultimaLineaEn = SystemClock.elapsedRealtime()
        val candidato = synchronized(ultimasLineas) {
            ultimasLineas.add(texto)
            if (ultimasLineas.size > DeteccionProtocolo.MAX_LINEAS_RECIENTES) ultimasLineas.removeAt(0)

            if (protocoloActual()?.parse(texto) != null) {
                lineasSinInterpretar = 0
                return@synchronized null
            }
            lineasSinInterpretar++
            if (lineasSinInterpretar < DeteccionProtocolo.MIN_LINEAS_SIN_INTERPRETAR) {
                return@synchronized null
            }
            DeteccionProtocolo.elegir(ultimasLineas.toList(), protocolIndex)?.also {
                lineasSinInterpretar = 0
            }
        }
        if (candidato != null) {
            protocolIndex = candidato
            emitir(
                ScaleEvent.Status(
                    "Protocolo ajustado automáticamente a ${ScaleProtocols.all[candidato].displayName}"
                )
            )
        }
    }
}

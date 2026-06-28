package com.rommel.scaleprototype

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.IOException
import java.io.InputStream
import java.util.UUID

/**
 * Conecta a una balanza por Bluetooth clásico usando el perfil serie (SPP), que es lo
 * que usa el kit Bluetooth de la Ranger 3000 (no es BLE, por eso no sirve Web Bluetooth).
 * Lee el flujo de salida continuo de la balanza línea por línea (separadas por \r o \n).
 */
class ScaleBluetoothClient(
    private val scope: CoroutineScope,
    private val onEvent: (ScaleEvent) -> Unit
) {
    private var socket: BluetoothSocket? = null
    private var readJob: Job? = null

    @Volatile
    private var disconnectRequested = false

    @SuppressLint("MissingPermission") // el llamador (MainActivity) verifica BLUETOOTH_CONNECT antes de invocar
    fun connect(device: BluetoothDevice) {
        disconnectRequested = false
        readJob?.cancel()
        readJob = scope.launch(Dispatchers.IO) {
            try {
                onEvent(ScaleEvent.Status("Conectando a ${device.name ?: device.address}…"))
                val openedSocket = openSocket(device)
                socket = openedSocket
                onEvent(ScaleEvent.Connected)
                readLoop(openedSocket.inputStream)
            } catch (e: IOException) {
                if (!disconnectRequested) {
                    onEvent(ScaleEvent.Error(e.message ?: "Error de conexión"))
                }
            } finally {
                closeQuietly()
                onEvent(ScaleEvent.Disconnected)
            }
        }
    }

    @SuppressLint("MissingPermission") // el llamador (MainActivity) verifica BLUETOOTH_CONNECT antes de invocar
    private fun openSocket(device: BluetoothDevice): BluetoothSocket {
        val secure = runCatching {
            device.createRfcommSocketToServiceRecord(SPP_UUID).also { it.connect() }
        }
        secure.getOrNull()?.let { return it }

        val insecure = runCatching {
            device.createInsecureRfcommSocketToServiceRecord(SPP_UUID).also { it.connect() }
        }
        insecure.getOrNull()?.let { return it }

        throw IOException(
            "No se pudo abrir el socket SPP: " +
                (secure.exceptionOrNull()?.message
                    ?: insecure.exceptionOrNull()?.message
                    ?: "motivo desconocido")
        )
    }

    private fun readLoop(input: InputStream) {
        val lineBuffer = StringBuilder()
        val buffer = ByteArray(256)
        while (true) {
            val readCount = input.read(buffer)
            if (readCount == -1) break
            for (i in 0 until readCount) {
                val ch = (buffer[i].toInt() and 0xFF).toChar()
                if (ch == '\r' || ch == '\n') {
                    if (lineBuffer.isNotEmpty()) {
                        onEvent(ScaleEvent.RawLine(lineBuffer.toString()))
                        lineBuffer.clear()
                    }
                } else {
                    lineBuffer.append(ch)
                }
            }
        }
    }

    fun disconnect() {
        disconnectRequested = true
        readJob?.cancel()
        closeQuietly()
    }

    private fun closeQuietly() {
        runCatching { socket?.close() }
        socket = null
    }

    companion object {
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }
}

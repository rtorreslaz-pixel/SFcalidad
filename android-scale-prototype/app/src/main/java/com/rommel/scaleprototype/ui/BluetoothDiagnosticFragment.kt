package com.rommel.scaleprototype.ui

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.ScaleConnectionManager
import com.rommel.scaleprototype.ScaleEvent
import com.rommel.scaleprototype.ScaleProtocols
import com.rommel.scaleprototype.databinding.FragmentBluetoothDiagnosticBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ApiException
import com.rommel.scaleprototype.net.LiveWeightRequest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Pantalla de debug original (antes activity_main.xml + MainActivity.kt), movida casi
// textual a una pantalla secundaria. Además persiste la última báscula/protocolo
// conectados en SharedPreferences para que CaptureFragment se reconecte solo.
class BluetoothDiagnosticFragment : Fragment() {

    private var binding: FragmentBluetoothDiagnosticBinding? = null
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bondedDevices: List<BluetoothDevice> = emptyList()
    private var lastSelectedDevice: BluetoothDevice? = null
    private val scaleListener: (ScaleEvent) -> Unit = { event -> handleScaleEvent(event) }
    private val timeFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())
    private var ultimoEnvioMillis = 0L

    private val requestBluetoothConnect = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            refreshBondedDevices()
        } else {
            setStatus(getString(R.string.permission_denied))
        }
    }

    private val requestEnableBluetooth = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { refreshBondedDevices() }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentBluetoothDiagnosticBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val b = binding ?: return

        val manager = requireContext().getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = manager.adapter

        b.buttonRefresh.setOnClickListener { ensurePermissionThenRefresh() }
        b.buttonBtSettings.setOnClickListener {
            startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
        }
        b.buttonConnect.setOnClickListener { onConnectClicked() }
        b.buttonCopyLog.setOnClickListener { copyLogToClipboard() }
        b.buttonClearLog.setOnClickListener { b.textLog.text = "" }

        b.spinnerProtocol.adapter = ArrayAdapter(
            requireContext(), android.R.layout.simple_spinner_dropdown_item, ScaleProtocols.all.map { it.displayName }
        )
        restoreSavedProtocolSelection()
        // El listener se instala DESPUÉS de restaurar, para que la restauración no dispare un
        // guardado con la selección inicial (0) antes de tener la buena.
        b.spinnerProtocol.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                onProtocoloElegido(position)
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }

        ensurePermissionThenRefresh()

        // Refleja la conexión que ya vive en el gestor (persiste entre pantallas).
        ScaleConnectionManager.addListener(scaleListener)
        syncConnectButton()
        if (ScaleConnectionManager.isConnected()) setStatus(getString(R.string.connected))
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // NO se desconecta la báscula al salir: la conexión debe seguir viva para pesar.
        ScaleConnectionManager.removeListener(scaleListener)
        binding = null
    }

    private fun syncConnectButton() {
        val b = binding ?: return
        b.buttonConnect.isEnabled = true
        b.buttonConnect.text = getString(
            if (ScaleConnectionManager.isConnected()) R.string.action_disconnect else R.string.action_connect
        )
    }

    private fun hasBluetoothConnectPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return ContextCompat.checkSelfPermission(
            requireContext(), Manifest.permission.BLUETOOTH_CONNECT
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun ensurePermissionThenRefresh() {
        if (!hasBluetoothConnectPermission()) {
            requestBluetoothConnect.launch(Manifest.permission.BLUETOOTH_CONNECT)
            return
        }
        val adapter = bluetoothAdapter
        if (adapter == null) {
            setStatus(getString(R.string.no_bluetooth_adapter))
            return
        }
        if (!adapter.isEnabled) {
            requestEnableBluetooth.launch(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE))
            return
        }
        refreshBondedDevices()
    }

    @SuppressLint("MissingPermission") // hasBluetoothConnectPermission() ya fue verificado arriba
    private fun refreshBondedDevices() {
        val adapter = bluetoothAdapter ?: return
        if (!hasBluetoothConnectPermission() || !adapter.isEnabled) return
        val b = binding ?: return

        bondedDevices = adapter.bondedDevices.toList()
        val labels = bondedDevices.map { device ->
            "${device.name ?: "(sin nombre)"} — ${device.address}"
        }
        b.spinnerDevices.adapter = ArrayAdapter(
            requireContext(), android.R.layout.simple_spinner_dropdown_item, labels
        )
        restoreSavedDeviceSelection()
        setStatus(
            if (bondedDevices.isEmpty()) getString(R.string.no_paired_devices)
            else getString(R.string.devices_found, bondedDevices.size)
        )
    }

    private fun onConnectClicked() {
        val b = binding ?: return
        if (ScaleConnectionManager.state != ScaleConnectionManager.State.DISCONNECTED) {
            ScaleConnectionManager.disconnect()
            return
        }
        if (!hasBluetoothConnectPermission()) {
            requestBluetoothConnect.launch(Manifest.permission.BLUETOOTH_CONNECT)
            return
        }
        val index = b.spinnerDevices.selectedItemPosition
        val device = bondedDevices.getOrNull(index)
        if (device == null) {
            Toast.makeText(requireContext(), getString(R.string.select_device_first), Toast.LENGTH_SHORT).show()
            return
        }

        lastSelectedDevice = device
        // Se guarda ya la selección para que Captura pueda reconectar aunque se navegue rápido.
        saveLastScaleSelection(device)
        b.buttonConnect.isEnabled = false
        ScaleConnectionManager.connect(device, b.spinnerProtocol.selectedItemPosition)
    }

    private fun handleScaleEvent(event: ScaleEvent) {
        val b = binding ?: return
        when (event) {
            is ScaleEvent.Status -> setStatus(event.message)
            is ScaleEvent.Connected -> {
                syncConnectButton()
                setStatus(getString(R.string.connected))
                lastSelectedDevice?.let { saveLastScaleSelection(it) }
            }
            is ScaleEvent.Disconnected -> {
                syncConnectButton()
                setStatus(getString(R.string.disconnected))
            }
            is ScaleEvent.Error -> {
                syncConnectButton()
                setStatus(getString(R.string.error_format, event.message))
                appendLog("⚠ ${event.message}")
            }
            is ScaleEvent.RawLine -> {
                appendLog(event.text)
                updateWeightFromLine(event.text)
            }
        }
    }

    /**
     * Fija el protocolo elegido en el desplegable: se aplica al vuelo (sin reconectar) y queda
     * guardado. Antes esta pantalla interpretaba con el desplegable en vivo pero nadie avisaba a
     * la de pesaje, que seguía con el protocolo del momento de conectar — de ahí que aquí se
     * viera el peso y allá "-- kg".
     */
    private fun onProtocoloElegido(index: Int) {
        val ctx = context ?: return // el spinner puede notificar después de salir de la pantalla
        if (index !in ScaleProtocols.all.indices) return
        ScaleConnectionManager.setProtocol(index)
        ctx.getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putInt(CaptureFragment.KEY_LAST_PROTOCOL_INDEX, index)
            .apply()
    }

    private fun updateWeightFromLine(line: String) {
        val b = binding ?: return
        // Un solo origen de verdad: el protocolo que el gestor está aplicando, el mismo que usa
        // la pantalla de pesaje. El desplegable lo fija; ya no se interpreta distinto por pantalla.
        val indiceGestor = ScaleConnectionManager.protocolIndex
        if (indiceGestor in ScaleProtocols.all.indices && indiceGestor != b.spinnerProtocol.selectedItemPosition) {
            // Refleja un cambio automático de protocolo para que el desplegable no mienta.
            b.spinnerProtocol.setSelection(indiceGestor)
        }
        val protocol = ScaleConnectionManager.protocoloActual()
            ?: ScaleProtocols.all.getOrNull(b.spinnerProtocol.selectedItemPosition)
            ?: ScaleProtocols.default
        val parsed = protocol.parse(line) ?: return
        b.textWeight.text = getString(R.string.weight_format, parsed.value, parsed.unit ?: "")
        enviarPesoAWeb(parsed.value)
    }

    /**
     * Envía el peso al monitor de la web también desde esta pantalla. Antes solo lo hacía la
     * pantalla de captura, así que una prueba de conexión hecha aquí no se veía en la web y
     * parecía que la app no estaba comunicando. Va sin datos de lote (aquí no hay lote elegido):
     * en el monitor aparece como la balanza del verificador, sin plantel ni corral.
     */
    private fun enviarPesoAWeb(valueKg: Double) {
        val ahora = System.currentTimeMillis()
        if (ahora - ultimoEnvioMillis < ENVIO_THROTTLE_MS) return
        ultimoEnvioMillis = ahora
        viewLifecycleOwner.lifecycleScope.launch {
            val resultado = runCatching {
                ApiClient.getInstance(requireContext()).postLiveWeight(
                    LiveWeightRequest(pesoGramos = valueKg * 1000.0)
                )
            }
            val vista = binding?.textEnvioWeb ?: return@launch
            vista.visibility = View.VISIBLE
            val error = resultado.exceptionOrNull()
            when {
                error == null -> {
                    vista.text = getString(R.string.envio_web_ok)
                    vista.setTextColor(ContextCompat.getColor(requireContext(), R.color.sf_green))
                }
                error is ApiException && error.code == 401 -> {
                    vista.text = getString(R.string.envio_web_sesion)
                    vista.setTextColor(ContextCompat.getColor(requireContext(), R.color.sf_red))
                }
                else -> {
                    vista.text = getString(R.string.envio_web_error)
                    vista.setTextColor(ContextCompat.getColor(requireContext(), R.color.sf_amber))
                }
            }
        }
    }

    private fun appendLog(line: String) {
        val b = binding ?: return
        val timestamp = timeFormat.format(Date())
        val hexSuffix = if (b.checkboxHex.isChecked) {
            "  [" + line.toByteArray(Charsets.ISO_8859_1).joinToString(" ") { "%02X".format(it) } + "]"
        } else {
            ""
        }
        b.textLog.append("$timestamp  $line$hexSuffix\n")
        b.scrollLog.post { b.scrollLog.fullScroll(View.FOCUS_DOWN) }
    }

    private fun setStatus(text: String) {
        binding?.textStatus?.text = text
    }

    private fun copyLogToClipboard() {
        val clipboard = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("scale-log", binding?.textLog?.text.toString()))
        Toast.makeText(requireContext(), getString(R.string.log_copied), Toast.LENGTH_SHORT).show()
    }

    private fun saveLastScaleSelection(device: BluetoothDevice) {
        val protocolIndex = binding?.spinnerProtocol?.selectedItemPosition ?: return
        requireContext().getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(CaptureFragment.KEY_LAST_DEVICE_ADDRESS, device.address)
            .putInt(CaptureFragment.KEY_LAST_PROTOCOL_INDEX, protocolIndex)
            .apply()
    }

    @SuppressLint("MissingPermission") // hasBluetoothConnectPermission() ya fue verificado en refreshBondedDevices()
    private fun restoreSavedDeviceSelection() {
        val b = binding ?: return
        val savedAddress = requireContext()
            .getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
            .getString(CaptureFragment.KEY_LAST_DEVICE_ADDRESS, null) ?: return
        val index = bondedDevices.indexOfFirst { it.address == savedAddress }
        if (index >= 0) b.spinnerDevices.setSelection(index)
    }

    private fun restoreSavedProtocolSelection() {
        val b = binding ?: return
        val index = requireContext()
            .getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
            .getInt(CaptureFragment.KEY_LAST_PROTOCOL_INDEX, -1)
        if (index in ScaleProtocols.all.indices) b.spinnerProtocol.setSelection(index)
    }

    companion object {
        /** La báscula manda varias lecturas por segundo: no tiene sentido subirlas todas. */
        private const val ENVIO_THROTTLE_MS = 1500L
    }
}

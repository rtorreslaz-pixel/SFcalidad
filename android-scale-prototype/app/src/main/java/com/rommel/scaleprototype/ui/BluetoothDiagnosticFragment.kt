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
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.ScaleBluetoothClient
import com.rommel.scaleprototype.ScaleEvent
import com.rommel.scaleprototype.ScaleProtocols
import com.rommel.scaleprototype.databinding.FragmentBluetoothDiagnosticBinding
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
    private var scaleClient: ScaleBluetoothClient? = null
    private var isConnected = false
    private val timeFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())

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

        ensurePermissionThenRefresh()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        scaleClient?.disconnect()
        binding = null
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
        if (isConnected) {
            scaleClient?.disconnect()
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

        scaleClient = ScaleBluetoothClient(viewLifecycleOwner.lifecycleScope) { event ->
            activity?.runOnUiThread { handleScaleEvent(event, device) }
        }
        b.buttonConnect.isEnabled = false
        scaleClient?.connect(device)
    }

    private fun handleScaleEvent(event: ScaleEvent, device: BluetoothDevice) {
        val b = binding ?: return
        when (event) {
            is ScaleEvent.Status -> setStatus(event.message)
            is ScaleEvent.Connected -> {
                isConnected = true
                b.buttonConnect.isEnabled = true
                b.buttonConnect.text = getString(R.string.action_disconnect)
                setStatus(getString(R.string.connected))
                saveLastScaleSelection(device)
            }
            is ScaleEvent.Disconnected -> {
                isConnected = false
                b.buttonConnect.isEnabled = true
                b.buttonConnect.text = getString(R.string.action_connect)
                setStatus(getString(R.string.disconnected))
            }
            is ScaleEvent.Error -> {
                b.buttonConnect.isEnabled = true
                setStatus(getString(R.string.error_format, event.message))
                appendLog("⚠ ${event.message}")
            }
            is ScaleEvent.RawLine -> {
                appendLog(event.text)
                updateWeightFromLine(event.text)
            }
        }
    }

    private fun updateWeightFromLine(line: String) {
        val b = binding ?: return
        val protocolIndex = b.spinnerProtocol.selectedItemPosition
        val protocol = ScaleProtocols.all.getOrNull(protocolIndex) ?: ScaleProtocols.default
        val parsed = protocol.parse(line) ?: return
        b.textWeight.text = getString(R.string.weight_format, parsed.value, parsed.unit ?: "")
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
}

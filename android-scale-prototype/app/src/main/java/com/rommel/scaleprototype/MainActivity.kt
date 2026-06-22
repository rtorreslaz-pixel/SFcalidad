package com.rommel.scaleprototype

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
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.rommel.scaleprototype.databinding.ActivityMainBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val manager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = manager.adapter

        binding.buttonRefresh.setOnClickListener { ensurePermissionThenRefresh() }
        binding.buttonBtSettings.setOnClickListener {
            startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
        }
        binding.buttonConnect.setOnClickListener { onConnectClicked() }
        binding.buttonCopyLog.setOnClickListener { copyLogToClipboard() }
        binding.buttonClearLog.setOnClickListener { binding.textLog.text = "" }

        binding.spinnerProtocol.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item, ScaleProtocols.all.map { it.displayName }
        )

        ensurePermissionThenRefresh()
    }

    override fun onDestroy() {
        super.onDestroy()
        scaleClient?.disconnect()
    }

    private fun hasBluetoothConnectPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return ContextCompat.checkSelfPermission(
            this, Manifest.permission.BLUETOOTH_CONNECT
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

        bondedDevices = adapter.bondedDevices.toList()
        val labels = bondedDevices.map { device ->
            "${device.name ?: "(sin nombre)"} — ${device.address}"
        }
        binding.spinnerDevices.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item, labels
        )
        setStatus(
            if (bondedDevices.isEmpty()) getString(R.string.no_paired_devices)
            else getString(R.string.devices_found, bondedDevices.size)
        )
    }

    private fun onConnectClicked() {
        if (isConnected) {
            scaleClient?.disconnect()
            return
        }
        if (!hasBluetoothConnectPermission()) {
            requestBluetoothConnect.launch(Manifest.permission.BLUETOOTH_CONNECT)
            return
        }
        val index = binding.spinnerDevices.selectedItemPosition
        val device = bondedDevices.getOrNull(index)
        if (device == null) {
            Toast.makeText(this, getString(R.string.select_device_first), Toast.LENGTH_SHORT).show()
            return
        }

        scaleClient = ScaleBluetoothClient(lifecycleScope) { event ->
            runOnUiThread { handleScaleEvent(event) }
        }
        binding.buttonConnect.isEnabled = false
        scaleClient?.connect(device)
    }

    private fun handleScaleEvent(event: ScaleEvent) {
        when (event) {
            is ScaleEvent.Status -> setStatus(event.message)
            is ScaleEvent.Connected -> {
                isConnected = true
                binding.buttonConnect.isEnabled = true
                binding.buttonConnect.text = getString(R.string.action_disconnect)
                setStatus(getString(R.string.connected))
            }
            is ScaleEvent.Disconnected -> {
                isConnected = false
                binding.buttonConnect.isEnabled = true
                binding.buttonConnect.text = getString(R.string.action_connect)
                setStatus(getString(R.string.disconnected))
            }
            is ScaleEvent.Error -> {
                binding.buttonConnect.isEnabled = true
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
        val protocolIndex = binding.spinnerProtocol.selectedItemPosition
        val protocol = ScaleProtocols.all.getOrNull(protocolIndex) ?: ScaleProtocols.default
        val parsed = protocol.parse(line) ?: return
        binding.textWeight.text = getString(
            R.string.weight_format, parsed.value, parsed.unit ?: ""
        )
    }

    private fun appendLog(line: String) {
        val timestamp = timeFormat.format(Date())
        val hexSuffix = if (binding.checkboxHex.isChecked) {
            "  [" + line.toByteArray(Charsets.ISO_8859_1).joinToString(" ") { "%02X".format(it) } + "]"
        } else {
            ""
        }
        binding.textLog.append("$timestamp  $line$hexSuffix\n")
        binding.scrollLog.post { binding.scrollLog.fullScroll(View.FOCUS_DOWN) }
    }

    private fun setStatus(text: String) {
        binding.textStatus.text = text
    }

    private fun copyLogToClipboard() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("scale-log", binding.textLog.text.toString()))
        Toast.makeText(this, getString(R.string.log_copied), Toast.LENGTH_SHORT).show()
    }
}

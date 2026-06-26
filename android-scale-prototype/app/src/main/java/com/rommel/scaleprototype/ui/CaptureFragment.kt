package com.rommel.scaleprototype.ui

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.ScaleBluetoothClient
import com.rommel.scaleprototype.ScaleEvent
import com.rommel.scaleprototype.ScaleProtocols
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.RegistroPeso
import com.rommel.scaleprototype.databinding.FragmentCaptureBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.LiveWeightRequest
import com.rommel.scaleprototype.sync.SyncScheduler
import kotlinx.coroutines.launch
import java.util.UUID

class CaptureFragment : Fragment() {

    private var binding: FragmentCaptureBinding? = null
    private var scaleClient: ScaleBluetoothClient? = null
    private var latestWeightGramos: Double? = null
    private var lastLiveWeightSentAtMillis = 0L

    private lateinit var plantelId: String
    private lateinit var plantelCodigo: String
    private lateinit var campania: String
    private lateinit var galpon: String
    private lateinit var corral: String
    private lateinit var categoria: String

    private val requestBluetoothConnect = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> if (granted) connectToSavedScale() }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentCaptureBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val args = requireArguments()
        plantelId = args.getString(CaptureSetupFragment.ARG_PLANTEL_ID)!!
        plantelCodigo = args.getString(CaptureSetupFragment.ARG_PLANTEL_CODIGO)!!
        campania = args.getString(CaptureSetupFragment.ARG_CAMPANIA)!!
        galpon = args.getString(CaptureSetupFragment.ARG_GALPON)!!
        corral = args.getString(CaptureSetupFragment.ARG_CORRAL)!!
        categoria = args.getString(CaptureSetupFragment.ARG_CATEGORIA)!!

        binding?.textSelectionHeader?.text =
            getString(R.string.capture_header_format, plantelCodigo, campania, galpon, categoria, corral)

        binding?.textChangeSelection?.setOnClickListener {
            findNavController().navigate(R.id.action_capture_to_captureSetup)
        }
        binding?.textOpenDiagnostic?.setOnClickListener {
            findNavController().navigate(R.id.action_capture_to_diagnostic)
        }
        binding?.buttonRegisterAve?.setOnClickListener { onRegisterAveClicked() }

        binding?.spinnerPigmentacion?.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            (0..7).toList(),
        )
        binding?.switchEvaluarCalidad?.setOnCheckedChangeListener { _, checked ->
            binding?.layoutCalidad?.visibility = if (checked) View.VISIBLE else View.GONE
        }

        observePendingCount()
        ensurePermissionThenConnect()
    }

    override fun onResume() {
        super.onResume()
        // El SyncWorker borra la sesión local si el servidor responde 401 (token revocado o
        // rotado desde /admin/usuarios). Se revisa aquí -- no solo al entrar -- porque esa
        // revocación puede ocurrir en cualquier momento mientras esta pantalla está abierta.
        if (!AuthRepository(requireContext()).isLoggedIn()) {
            Toast.makeText(requireContext(), getString(R.string.session_revoked_message), Toast.LENGTH_LONG).show()
            findNavController().navigate(R.id.action_capture_to_login)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        scaleClient?.disconnect()
        scaleClient = null
        binding = null
    }

    private fun observePendingCount() {
        val dao = AppDatabase.getInstance(requireContext()).registroPesoDao()
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                dao.countUnsyncedFlow().collect { count ->
                    binding?.textPendingBadge?.text = getString(R.string.pending_count_format, count)
                }
            }
        }
    }

    private fun hasBluetoothConnectPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return ContextCompat.checkSelfPermission(
            requireContext(), Manifest.permission.BLUETOOTH_CONNECT
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun ensurePermissionThenConnect() {
        if (!hasBluetoothConnectPermission()) {
            requestBluetoothConnect.launch(Manifest.permission.BLUETOOTH_CONNECT)
            return
        }
        connectToSavedScale()
    }

    @SuppressLint("MissingPermission") // hasBluetoothConnectPermission() ya fue verificado arriba
    private fun connectToSavedScale() {
        val prefs = requireContext().getSharedPreferences(SCALE_PREFS_NAME, Context.MODE_PRIVATE)
        val address = prefs.getString(KEY_LAST_DEVICE_ADDRESS, null)
        if (address == null) {
            setStatus(getString(R.string.status_no_saved_scale))
            return
        }

        val manager = requireContext().getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = manager.adapter
        if (adapter == null || !adapter.isEnabled) {
            setStatus(getString(R.string.status_bluetooth_disabled))
            return
        }

        val device = runCatching { adapter.getRemoteDevice(address) }.getOrNull()
        if (device == null) {
            setStatus(getString(R.string.status_no_saved_scale))
            return
        }

        setStatus(getString(R.string.status_connecting))
        scaleClient = ScaleBluetoothClient(viewLifecycleOwner.lifecycleScope) { event ->
            activity?.runOnUiThread { handleScaleEvent(event) }
        }
        scaleClient?.connect(device)
    }

    private fun handleScaleEvent(event: ScaleEvent) {
        when (event) {
            is ScaleEvent.Status -> setStatus(event.message)
            is ScaleEvent.Connected -> setStatus(getString(R.string.connected))
            is ScaleEvent.Disconnected -> {
                setStatus(getString(R.string.disconnected))
                setWeight(null)
            }
            is ScaleEvent.Error -> setStatus(getString(R.string.error_format, event.message))
            is ScaleEvent.RawLine -> updateWeightFromLine(event.text)
        }
    }

    private fun updateWeightFromLine(line: String) {
        val prefs = requireContext().getSharedPreferences(SCALE_PREFS_NAME, Context.MODE_PRIVATE)
        val protocolIndex = prefs.getInt(KEY_LAST_PROTOCOL_INDEX, -1)
        val protocol = ScaleProtocols.all.getOrNull(protocolIndex) ?: ScaleProtocols.default
        val parsed = protocol.parse(line) ?: return
        setWeight(parsed.value)
        maybeSendLiveWeight(parsed.value)
    }

    // Best-effort: a diferencia de los registros (Room + WorkManager), una lectura en vivo
    // vieja no sirve de nada, así que sin internet simplemente se omite en vez de encolarse.
    private fun maybeSendLiveWeight(valueKg: Double) {
        val now = System.currentTimeMillis()
        if (now - lastLiveWeightSentAtMillis < LIVE_WEIGHT_THROTTLE_MS) return
        lastLiveWeightSentAtMillis = now
        viewLifecycleOwner.lifecycleScope.launch {
            runCatching {
                ApiClient.getInstance(requireContext()).postLiveWeight(
                    LiveWeightRequest(
                        pesoGramos = valueKg * 1000.0,
                        plantelCodigo = plantelCodigo,
                        campania = campania,
                        galpon = galpon,
                        corral = corral,
                        categoria = categoria,
                    )
                )
            }
        }
    }

    private fun setWeight(valueKg: Double?) {
        latestWeightGramos = valueKg?.let { it * 1000.0 }
        binding?.textCaptureWeight?.text = if (valueKg != null) {
            getString(R.string.weight_format, valueKg, "kg")
        } else {
            getString(R.string.weight_placeholder)
        }
        binding?.buttonRegisterAve?.isEnabled = latestWeightGramos != null
    }

    private fun setStatus(text: String) {
        binding?.textCaptureStatus?.text = text
    }

    private fun onRegisterAveClicked() {
        val pesoGramos = latestWeightGramos ?: return
        val dao = AppDatabase.getInstance(requireContext()).registroPesoDao()
        val evaluarCalidad = binding?.switchEvaluarCalidad?.isChecked == true
        val tieneHematoma = if (evaluarCalidad) binding?.switchHematoma?.isChecked else null
        val tieneDefectoSeleccion = if (evaluarCalidad) binding?.switchDefectoSeleccion?.isChecked else null
        val gradoPododermatitis = if (evaluarCalidad) gradoFromRadioGroup(
            binding?.radioGroupPododermatitis?.checkedRadioButtonId, R.id.radioPodoLeve, R.id.radioPodoGrave
        ) else null
        val gradoRasguno = if (evaluarCalidad) gradoFromRadioGroup(
            binding?.radioGroupRasguno?.checkedRadioButtonId, R.id.radioRasgLeve, R.id.radioRasgGrave
        ) else null
        val pigmentacion = if (evaluarCalidad) binding?.spinnerPigmentacion?.selectedItemPosition else null

        viewLifecycleOwner.lifecycleScope.launch {
            val nowMillis = System.currentTimeMillis()
            val numeroAve = (dao.getMaxNumeroAve(plantelId, campania, galpon, corral, categoria) ?: 0) + 1
            dao.insert(
                RegistroPeso(
                    id = UUID.randomUUID().toString(),
                    plantelId = plantelId,
                    plantelCodigo = plantelCodigo,
                    campania = campania,
                    galpon = galpon,
                    corral = corral,
                    categoria = categoria,
                    numeroAve = numeroAve,
                    pesoGramos = pesoGramos,
                    fechaHoraEpochMillis = nowMillis,
                    tieneHematoma = tieneHematoma,
                    tieneDefectoSeleccion = tieneDefectoSeleccion,
                    gradoPododermatitis = gradoPododermatitis,
                    gradoRasguno = gradoRasguno,
                    pigmentacion = pigmentacion,
                    createdAtEpochMillis = nowMillis,
                )
            )
            SyncScheduler.scheduleSyncNow(requireContext())
            binding?.textLastRegistered?.text = getString(R.string.last_registered_format, numeroAve, pesoGramos)
        }
    }

    // 0 sin lesión, 1 leve, 2 grave -- mismo mapeo que EvaluacionLesion.{sinLesion,leve,grave}.
    private fun gradoFromRadioGroup(checkedId: Int?, leveId: Int, graveId: Int): Int = when (checkedId) {
        leveId -> 1
        graveId -> 2
        else -> 0
    }

    companion object {
        const val SCALE_PREFS_NAME = "scale_connection_prefs"
        const val KEY_LAST_DEVICE_ADDRESS = "last_device_address"
        const val KEY_LAST_PROTOCOL_INDEX = "last_protocol_index"
        private const val LIVE_WEIGHT_THROTTLE_MS = 1500L
    }
}

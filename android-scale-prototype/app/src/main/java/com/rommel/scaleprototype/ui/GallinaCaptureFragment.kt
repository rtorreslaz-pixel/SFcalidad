package com.rommel.scaleprototype.ui

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.ScaleConnectionManager
import com.rommel.scaleprototype.ScaleEvent
import com.rommel.scaleprototype.ScaleProtocols
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.GallinaDespacho
import com.rommel.scaleprototype.data.GallinaPesada
import com.rommel.scaleprototype.databinding.FragmentGallinaCaptureBinding
import com.rommel.scaleprototype.databinding.ItemPesadaBinding
import com.rommel.scaleprototype.sync.SyncScheduler
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Captura del pesaje de gallina de descarte.
 *
 * Cada tanda de jabas se pesa DOS veces —vacía y con las gallinas dentro— en vez de
 * descontarle una tara fija como hace saca: las jabas de gallina vienen de distintos sitios
 * y su peso vacío no es confiable, así que se mide en el momento.
 *
 *   neto = peso con ave − peso destare
 *   unidades = jabas × densidad
 *   promedio por ave = neto ÷ unidades
 *
 * El despacho se guarda en el teléfono al finalizar y sube solo cuando hay señal.
 */
class GallinaCaptureFragment : Fragment() {

    private var binding: FragmentGallinaCaptureBinding? = null
    private val scaleListener: (ScaleEvent) -> Unit = { event -> handleScaleEvent(event) }

    /** Peso que marca la balanza ahora mismo, en gramos. */
    private var pesoActualGramos: Double? = null
    /** Los dos pesos capturados de la tanda en curso. */
    private var destareGramos: Double? = null
    private var conAveGramos: Double? = null
    private var ultimoPesoOkMillis = 0L

    private lateinit var clienteId: String
    private lateinit var clienteNombre: String
    private lateinit var materialId: String
    private lateinit var materialCodigo: String
    private lateinit var materialDesc: String
    private lateinit var guia: String
    private lateinit var placa: String
    private var densidad: Int = 1

    private val despachoId: String = UUID.randomUUID().toString()
    private val pesadas = mutableListOf<GallinaPesada>()
    private var despachoCreado = false

    private val requestBluetoothConnect = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> if (granted) conectarBasculaGuardada() }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentGallinaCaptureBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val args = requireArguments()
        clienteId = args.getString(GallinaSetupFragment.ARG_CLIENTE_ID)!!
        clienteNombre = args.getString(GallinaSetupFragment.ARG_CLIENTE_NOMBRE)!!
        materialId = args.getString(GallinaSetupFragment.ARG_MATERIAL_ID)!!
        materialCodigo = args.getString(GallinaSetupFragment.ARG_MATERIAL_CODIGO)!!
        materialDesc = args.getString(GallinaSetupFragment.ARG_MATERIAL_DESC)!!
        guia = args.getString(GallinaSetupFragment.ARG_GUIA)!!
        placa = args.getString(GallinaSetupFragment.ARG_PLACA)!!
        densidad = args.getInt(GallinaSetupFragment.ARG_DENSIDAD, 1)

        binding?.textGallinaHeader?.text = "$clienteNombre · $guia · $placa"
        binding?.textGallinaSubHeader?.text = "$materialCodigo — $materialDesc · $densidad aves/jaba"

        binding?.buttonGallinaDestare?.setOnClickListener { capturarPeso(esDestare = true) }
        binding?.buttonGallinaConAve?.setOnClickListener { capturarPeso(esDestare = false) }
        binding?.buttonGallinaRegistrar?.setOnClickListener { registrarPesada() }
        binding?.buttonGallinaFinalizar?.setOnClickListener { finalizar() }
        binding?.buttonGallinaDiagnostic?.setOnClickListener {
            findNavController().navigate(R.id.action_gallinaCapture_to_diagnostic)
        }

        ScaleConnectionManager.addListener(scaleListener)
        ensurePermissionThenConnect()
        vigilarLlegadaDeDatos()
        pintarPesadas()
    }

    // --- Tanda en curso ---

    /** Toma el peso que marca la balanza y lo fija como destare o como peso con ave. */
    private fun capturarPeso(esDestare: Boolean) {
        val peso = pesoActualGramos
        if (peso == null) {
            Toast.makeText(requireContext(), R.string.gallina_error_sin_peso, Toast.LENGTH_SHORT).show()
            return
        }
        if (esDestare) destareGramos = peso else conAveGramos = peso
        actualizarTanda()
    }

    private fun actualizarTanda() {
        val b = binding ?: return
        b.textGallinaDestare.text = destareGramos?.let {
            getString(R.string.gallina_destare_ok, it / 1000.0)
        } ?: ""
        b.textGallinaConAve.text = conAveGramos?.let {
            getString(R.string.gallina_con_ave_ok, it / 1000.0)
        } ?: ""

        val jabas = b.editGallinaJabas.text.toString().trim().toIntOrNull()
        val d = destareGramos
        val c = conAveGramos
        val listo = d != null && c != null && c > d && jabas != null && jabas > 0
        b.buttonGallinaRegistrar.isEnabled = listo

        b.textGallinaNeto.text = when {
            d == null || c == null -> getString(R.string.gallina_neto_vacio)
            // Las gallinas pesan: si el peso con ave no supera al de las jabas vacías, se
            // capturaron al revés. Se dice en pantalla antes de que ensucie el promedio.
            c <= d -> getString(R.string.gallina_neto_invalido)
            jabas == null || jabas <= 0 -> getString(R.string.gallina_error_jabas)
            else -> {
                val neto = c - d
                val unidades = jabas * densidad
                getString(
                    R.string.gallina_neto_format,
                    neto / 1000.0, unidades, Math.round(neto / unidades).toInt()
                )
            }
        }
    }

    private fun registrarPesada() {
        val b = binding ?: return
        val jabas = b.editGallinaJabas.text.toString().trim().toIntOrNull()
        val d = destareGramos
        val c = conAveGramos
        if (jabas == null || jabas <= 0) {
            Toast.makeText(requireContext(), R.string.gallina_error_jabas, Toast.LENGTH_SHORT).show()
            return
        }
        if (d == null || c == null || c <= d) {
            Toast.makeText(requireContext(), R.string.gallina_neto_invalido, Toast.LENGTH_SHORT).show()
            return
        }

        val neto = c - d
        val unidades = jabas * densidad
        pesadas.add(
            GallinaPesada(
                id = UUID.randomUUID().toString(),
                despachoId = despachoId,
                jabas = jabas,
                pesoDestareGramos = d,
                pesoConAveGramos = c,
                pesoNetoGramos = neto,
                unidades = unidades,
                promedioGramos = neto / unidades,
                fechaHoraEpochMillis = System.currentTimeMillis(),
            )
        )

        b.textGallinaUltima.text = getString(
            R.string.gallina_pesada_registrada, pesadas.size, jabas, Math.round(neto / unidades).toInt()
        )
        // La siguiente tanda empieza limpia: sus dos pesos son propios.
        destareGramos = null
        conAveGramos = null
        b.editGallinaJabas.setText("")
        actualizarTanda()
        pintarPesadas()
    }

    private fun pintarPesadas() {
        val b = binding ?: return
        b.containerGallinaPesadas.removeAllViews()
        val inflater = LayoutInflater.from(requireContext())
        for ((i, p) in pesadas.withIndex()) {
            val fila = ItemPesadaBinding.inflate(inflater, b.containerGallinaPesadas, false)
            fila.textPesadaTitulo.text = getString(R.string.gallina_item_format, i + 1, p.jabas)
            fila.textPesadaDetalle.text = getString(
                R.string.gallina_item_detalle,
                p.pesoDestareGramos / 1000.0, p.pesoConAveGramos / 1000.0, p.pesoNetoGramos / 1000.0,
            )
            fila.textPesadaPromedio.text =
                getString(R.string.gallina_item_prom, Math.round(p.promedioGramos).toInt())
            b.containerGallinaPesadas.addView(fila.root)
        }

        val totalJabas = pesadas.sumOf { it.jabas }
        val totalUnidades = pesadas.sumOf { it.unidades }
        val totalNeto = pesadas.sumOf { it.pesoNetoGramos }
        b.textGallinaResumen.text = if (pesadas.isEmpty()) {
            getString(R.string.gallina_sin_pesadas)
        } else {
            getString(
                R.string.gallina_resumen_format,
                pesadas.size, totalJabas, totalUnidades,
                // Promedio ponderado por ave del despacho, no el promedio de los promedios.
                Math.round(totalNeto / totalUnidades).toInt(),
            )
        }
    }

    // --- Cierre ---

    private fun finalizar() {
        if (pesadas.isEmpty()) {
            Toast.makeText(requireContext(), R.string.gallina_sin_pesadas, Toast.LENGTH_SHORT).show()
            return
        }
        val totalUnidades = pesadas.sumOf { it.unidades }
        val totalNeto = pesadas.sumOf { it.pesoNetoGramos }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.gallina_finalizar_titulo)
            .setMessage(
                getString(
                    R.string.gallina_finalizar_mensaje,
                    pesadas.size, totalUnidades, Math.round(totalNeto / totalUnidades).toInt(),
                )
            )
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.finalizar_confirm) { _, _ -> guardarYSalir() }
            .show()
    }

    private fun guardarYSalir() {
        val auth = AuthRepository(requireContext())
        viewLifecycleOwner.lifecycleScope.launch {
            val dao = AppDatabase.getInstance(requireContext()).gallinaDao()
            // El despacho se crea una sola vez, aunque se finalice dos veces por un doble toque.
            if (!despachoCreado) {
                dao.insertDespacho(
                    GallinaDespacho(
                        id = despachoId,
                        clienteId = clienteId,
                        clienteNombre = clienteNombre,
                        materialId = materialId,
                        materialCodigo = materialCodigo,
                        materialDescripcion = materialDesc,
                        guiaReferencia = guia,
                        placa = placa,
                        densidad = densidad,
                        fechaEpochMillis = System.currentTimeMillis(),
                        verificadorId = auth.getVerificadorId(),
                        verificadorNombre = auth.getVerificadorNombre(),
                        createdAtEpochMillis = System.currentTimeMillis(),
                    )
                )
                despachoCreado = true
                pesadas.forEach { dao.insertPesada(it) }
            }
            SyncScheduler.scheduleSyncNow(requireContext())
            findNavController().navigate(R.id.action_gallinaCapture_to_home)
        }
    }

    // --- Báscula (misma conexión compartida que preventa y saca) ---

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
        conectarBasculaGuardada()
    }

    @SuppressLint("MissingPermission") // el permiso se verifica arriba
    private fun conectarBasculaGuardada() {
        if (ScaleConnectionManager.isConnected()) {
            setStatus(getString(R.string.connected))
            return
        }
        val prefs = requireContext()
            .getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
        val address = prefs.getString(CaptureFragment.KEY_LAST_DEVICE_ADDRESS, null)
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
        ScaleConnectionManager.connect(device, prefs.getInt(CaptureFragment.KEY_LAST_PROTOCOL_INDEX, -1))
    }

    private fun handleScaleEvent(event: ScaleEvent) {
        when (event) {
            is ScaleEvent.Status -> setStatus(event.message)
            is ScaleEvent.Connected -> setStatus(getString(R.string.connected))
            is ScaleEvent.Disconnected -> {
                setStatus(getString(R.string.disconnected))
                pesoActualGramos = null
                binding?.textGallinaPeso?.text = getString(R.string.weight_placeholder)
            }
            is ScaleEvent.Error -> setStatus(getString(R.string.error_format, event.message))
            is ScaleEvent.RawLine -> actualizarPesoDesdeLinea(event.text)
        }
    }

    private fun actualizarPesoDesdeLinea(line: String) {
        val prefs = requireContext()
            .getSharedPreferences(CaptureFragment.SCALE_PREFS_NAME, Context.MODE_PRIVATE)
        val protocolIndex = ScaleConnectionManager.protocolIndex.takeIf { it >= 0 }
            ?: prefs.getInt(CaptureFragment.KEY_LAST_PROTOCOL_INDEX, -1)
        val protocol = ScaleProtocols.all.getOrNull(protocolIndex) ?: ScaleProtocols.default
        val parsed = protocol.parse(line) ?: return
        ultimoPesoOkMillis = SystemClock.elapsedRealtime()
        pesoActualGramos = parsed.value * 1000.0
        binding?.textGallinaPeso?.text = getString(R.string.weight_format, parsed.value, "kg")
    }

    /** Igual que en preventa y saca: si no entra peso, se explica por qué. */
    private fun vigilarLlegadaDeDatos() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                while (true) {
                    delay(INTERVALO_VIGILANCIA_MS)
                    if (!ScaleConnectionManager.isConnected()) continue
                    val ahora = SystemClock.elapsedRealtime()
                    if (ultimoPesoOkMillis == 0L || ahora - ultimoPesoOkMillis > TOLERANCIA_PESO_MS) {
                        setStatus(getString(R.string.status_sin_datos))
                    }
                }
            }
        }
    }

    private fun setStatus(text: String) {
        binding?.textGallinaStatus?.text = text
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // La conexión sigue viva: se comparte con las demás pantallas.
        ScaleConnectionManager.removeListener(scaleListener)
        binding = null
    }

    companion object {
        private const val INTERVALO_VIGILANCIA_MS = 2000L
        private const val TOLERANCIA_PESO_MS = 4000L
    }
}

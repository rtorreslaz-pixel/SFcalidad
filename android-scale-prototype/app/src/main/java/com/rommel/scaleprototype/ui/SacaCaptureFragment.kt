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
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.ScaleConnectionManager
import com.rommel.scaleprototype.ScaleEvent
import com.rommel.scaleprototype.ScaleProtocols
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.SacaMuestreo
import com.rommel.scaleprototype.data.SacaPesada
import com.rommel.scaleprototype.databinding.FragmentSacaCaptureBinding
import com.rommel.scaleprototype.databinding.ItemPesadaBinding
import com.rommel.scaleprototype.sync.SyncScheduler
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Captura del muestreo de saca. A diferencia de la preventa (una ave por lectura), aquí se pesan
 * VARIAS JABAS juntas: el peso que da la balanza es bruto y hay que descontarle la tara de esas
 * jabas para saber cuánto pesan las aves.
 *
 *   neto = bruto − tara × jabas
 *   promedio por ave = neto ÷ (jabas × aves por jaba)
 *
 * Todo se guarda primero en el teléfono (Room) y se sincroniza solo, igual que la preventa.
 */
class SacaCaptureFragment : Fragment() {

    private var binding: FragmentSacaCaptureBinding? = null
    private val scaleListener: (ScaleEvent) -> Unit = { event -> handleScaleEvent(event) }

    private lateinit var muestreoId: String
    private lateinit var plantelId: String
    private lateinit var plantelCodigo: String
    private lateinit var campania: String
    private lateinit var galpon: String
    private lateinit var corral: String
    private lateinit var categoria: String
    private var edad: Int = 0
    private var avesPorJaba: Int = 1
    private var taraGramosPorJaba: Double = 0.0
    private var tipoJaba: String = ""

    private var pesoBrutoGramos: Double? = null
    private var muestreoCreado = false
    private val pesadas = mutableListOf<SacaPesada>()

    private val requestBluetoothConnect = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> if (granted) conectarBasculaGuardada() }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentSacaCaptureBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val args = requireArguments()
        plantelId = args.getString(SacaSetupFragment.ARG_PLANTEL_ID)!!
        plantelCodigo = args.getString(SacaSetupFragment.ARG_PLANTEL_CODIGO)!!
        campania = args.getString(SacaSetupFragment.ARG_CAMPANIA)!!
        galpon = args.getString(SacaSetupFragment.ARG_GALPON)!!
        corral = args.getString(SacaSetupFragment.ARG_CORRAL) ?: ""
        categoria = args.getString(SacaSetupFragment.ARG_CATEGORIA)!!
        edad = args.getInt(SacaSetupFragment.ARG_EDAD, 0)
        avesPorJaba = args.getInt(SacaSetupFragment.ARG_AVES_POR_JABA, 1)
        taraGramosPorJaba = args.getDouble(SacaSetupFragment.ARG_TARA_GRAMOS, 0.0)
        tipoJaba = args.getString(SacaSetupFragment.ARG_TIPO_JABA) ?: ""
        muestreoId = UUID.randomUUID().toString()

        binding?.textSacaHeader?.text = "$plantelCodigo · $campania · G$galpon · $corral · $categoria"
        binding?.textSacaSubHeader?.text =
            "${if (edad > 0) "Edad $edad d · " else ""}$avesPorJaba aves/jaba · tara ${"%.1f".format(taraGramosPorJaba / 1000)} kg/jaba"

        binding?.buttonRegistrarPesada?.setOnClickListener { registrarPesada() }
        binding?.buttonFinalizarSaca?.setOnClickListener { finalizarSaca() }
        binding?.buttonSacaDiagnostic?.setOnClickListener {
            findNavController().navigate(R.id.action_sacaCapture_to_diagnostic)
        }

        ScaleConnectionManager.addListener(scaleListener)
        ensurePermissionThenConnect()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // La conexión sigue viva: se comparte con las demás pantallas.
        ScaleConnectionManager.removeListener(scaleListener)
        binding = null
    }

    // --- Báscula ---

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
                pesoBrutoGramos = null
                binding?.textSacaPesoBruto?.text = getString(R.string.weight_placeholder)
                actualizarNeto()
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
        pesoBrutoGramos = parsed.value * 1000.0
        binding?.textSacaPesoBruto?.text = getString(R.string.weight_format, parsed.value, "kg")
        actualizarNeto()
    }

    // --- Cálculo y registro de pesadas ---

    private fun jabasIngresadas(): Int? =
        binding?.editNumJabas?.text?.toString()?.trim()?.toIntOrNull()?.takeIf { it > 0 }

    /** neto = bruto − tara × jabas. Se muestra en vivo para que el verificador lo vea antes. */
    private fun actualizarNeto() {
        val jabas = jabasIngresadas()
        val bruto = pesoBrutoGramos
        binding?.textSacaNeto?.text = if (jabas == null || bruto == null) {
            getString(R.string.saca_neto_vacio)
        } else {
            getString(R.string.saca_neto_format, (bruto - taraGramosPorJaba * jabas) / 1000.0, jabas)
        }
    }

    private fun registrarPesada() {
        val jabas = jabasIngresadas()
        if (jabas == null) {
            Toast.makeText(requireContext(), getString(R.string.saca_error_jabas), Toast.LENGTH_SHORT).show()
            return
        }
        val bruto = pesoBrutoGramos
        if (bruto == null) {
            Toast.makeText(requireContext(), getString(R.string.saca_error_sin_peso), Toast.LENGTH_SHORT).show()
            return
        }

        val avesTotal = jabas * avesPorJaba
        val neto = bruto - taraGramosPorJaba * jabas
        val promedio = if (avesTotal > 0) neto / avesTotal else 0.0
        val ahora = System.currentTimeMillis()

        val pesada = SacaPesada(
            id = UUID.randomUUID().toString(),
            muestreoId = muestreoId,
            numJabas = jabas,
            pesoBrutoGramos = bruto,
            pesoNetoGramos = neto,
            avesTotal = avesTotal,
            promedioGramos = promedio,
            fechaHoraEpochMillis = ahora,
        )

        val dao = AppDatabase.getInstance(requireContext()).sacaDao()
        val auth = AuthRepository(requireContext())
        viewLifecycleOwner.lifecycleScope.launch {
            // El muestreo se crea con la primera pesada: si el verificador entra y sale sin
            // pesar nada, no queda un muestreo vacío en la cola.
            if (!muestreoCreado) {
                dao.insertMuestreo(
                    SacaMuestreo(
                        id = muestreoId,
                        plantelId = plantelId,
                        plantelCodigo = plantelCodigo,
                        campania = campania,
                        galpon = galpon,
                        corral = corral,
                        categoria = categoria,
                        edad = edad.takeIf { it > 0 },
                        avesPorJaba = avesPorJaba,
                        taraGramosPorJaba = taraGramosPorJaba,
                        tipoJaba = tipoJaba.ifBlank { null },
                        fechaEpochMillis = ahora,
                        verificadorId = auth.getVerificadorId(),
                        verificadorNombre = auth.getVerificadorNombre(),
                        createdAtEpochMillis = ahora,
                    )
                )
                muestreoCreado = true
            }
            dao.insertPesada(pesada)
            pesadas.add(pesada)
            binding?.textUltimaPesada?.text = getString(
                R.string.saca_pesada_registrada, pesadas.size, jabas, Math.round(promedio).toInt()
            )
            binding?.editNumJabas?.setText("")
            actualizarNeto()
            pintarPesadas()
        }
    }

    private fun pintarPesadas() {
        val b = binding ?: return
        b.containerPesadas.removeAllViews()
        val inflater = LayoutInflater.from(requireContext())
        for ((i, p) in pesadas.withIndex()) {
            val fila = ItemPesadaBinding.inflate(inflater, b.containerPesadas, false)
            fila.textPesadaTitulo.text = getString(R.string.saca_item_format, i + 1, p.numJabas)
            fila.textPesadaDetalle.text = getString(
                R.string.saca_item_detalle,
                p.pesoBrutoGramos / 1000.0,
                taraGramosPorJaba * p.numJabas / 1000.0,
                p.pesoNetoGramos / 1000.0,
            )
            fila.textPesadaPromedio.text = getString(R.string.saca_item_prom, Math.round(p.promedioGramos).toInt())
            b.containerPesadas.addView(fila.root)
        }

        val totalJabas = pesadas.sumOf { it.numJabas }
        val totalAves = pesadas.sumOf { it.avesTotal }
        val totalNeto = pesadas.sumOf { it.pesoNetoGramos }
        val promedioGeneral = if (totalAves > 0) totalNeto / totalAves else 0.0
        b.textSacaResumen.text = if (pesadas.isEmpty()) {
            getString(R.string.saca_sin_pesadas)
        } else {
            getString(
                R.string.saca_resumen_format,
                pesadas.size, totalJabas, totalAves, Math.round(promedioGeneral).toInt()
            )
        }
    }

    private fun finalizarSaca() {
        if (pesadas.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.saca_sin_pesadas), Toast.LENGTH_SHORT).show()
            return
        }
        val totalJabas = pesadas.sumOf { it.numJabas }
        val totalAves = pesadas.sumOf { it.avesTotal }
        val totalNeto = pesadas.sumOf { it.pesoNetoGramos }
        val promedio = if (totalAves > 0) totalNeto / totalAves else 0.0

        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.saca_finalizar_titulo)
            .setMessage(
                getString(
                    R.string.saca_finalizar_mensaje,
                    pesadas.size, totalJabas, Math.round(promedio).toInt()
                )
            )
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.finalizar_confirm) { _, _ ->
                // Los pendientes se siguen subiendo solos; la báscula queda conectada.
                SyncScheduler.scheduleSyncNow(requireContext())
                findNavController().navigate(R.id.action_sacaCapture_to_home)
            }
            .show()
    }

    private fun setStatus(text: String) {
        binding?.textSacaStatus?.text = text
    }
}

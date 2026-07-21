package com.rommel.scaleprototype.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.databinding.FragmentCaptureSetupBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ApiException
import com.rommel.scaleprototype.net.PlantelDto
import kotlinx.coroutines.launch

class CaptureSetupFragment : Fragment() {

    private var binding: FragmentCaptureSetupBinding? = null
    private var planteles: List<PlantelDto> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentCaptureSetupBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding?.spinnerNAvesPesada?.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            (1..10).toList(),
        )
        binding?.spinnerLinea?.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            LINEAS_GENETICAS,
        )
        loadPlanteles()
        warnIfStalePendingRecords()
        binding?.buttonStartCapture?.setOnClickListener { onStartCaptureClicked() }
    }

    /**
     * Disciplina operativa: si hay registros sin subir desde hace más de 12 horas, se
     * alerta al entrar — la única copia está en este teléfono hasta que sincronice.
     */
    private fun warnIfStalePendingRecords() {
        viewLifecycleOwner.lifecycleScope.launch {
            val dao = AppDatabase.getInstance(requireContext()).registroPesoDao()
            val count = dao.countUnsynced()
            if (count == 0) return@launch
            val oldest = dao.oldestUnsyncedEpochMillis() ?: return@launch
            val horas = (System.currentTimeMillis() - oldest) / MILLIS_PER_HOUR
            if (horas < STALE_PENDING_THRESHOLD_HOURS) return@launch
            val antiguedad = if (horas >= 24) {
                resources.getQuantityString(R.plurals.stale_pending_days, (horas / 24).toInt(), horas / 24)
            } else {
                getString(R.string.stale_pending_hours, horas)
            }
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.stale_pending_title)
                .setMessage(getString(R.string.stale_pending_message, count, antiguedad))
                .setPositiveButton(android.R.string.ok, null)
                .show()
        }
    }

    private fun loadPlanteles() {
        setLoading(true)
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.getInstance(requireContext()).getCatalogos()
                planteles = response.planteles
                binding?.spinnerPlantel?.adapter = ArrayAdapter(
                    requireContext(),
                    android.R.layout.simple_spinner_dropdown_item,
                    planteles.map { if (it.cliente != null) "${it.codigo} — ${it.cliente}" else it.codigo },
                )
            } catch (e: ApiException) {
                if (e.code == 401) {
                    forceReLogin()
                } else if (!loadPlantelesFromCache()) {
                    showError(getString(R.string.error_load_planteles, e.message))
                }
            } catch (e: Exception) {
                // Sin señal (típico en granja): se usa el catálogo guardado de la última
                // sesión con internet, para poder configurar la jornada 100% offline.
                if (!loadPlantelesFromCache()) {
                    showError(getString(R.string.error_load_planteles, e.message ?: e.javaClass.simpleName))
                }
            } finally {
                setLoading(false)
            }
        }
    }

    /** Puebla el spinner con el catálogo guardado. Devuelve false si nunca se descargó uno. */
    private fun loadPlantelesFromCache(): Boolean {
        val cached = ApiClient.getInstance(requireContext()).getCatalogosOffline() ?: return false
        if (cached.planteles.isEmpty()) return false
        planteles = cached.planteles
        binding?.spinnerPlantel?.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            planteles.map { if (it.cliente != null) "${it.codigo} — ${it.cliente}" else it.codigo },
        )
        Toast.makeText(requireContext(), getString(R.string.offline_catalog_notice), Toast.LENGTH_LONG).show()
        return true
    }

    private fun onStartCaptureClicked() {
        val b = binding ?: return
        val plantel = planteles.getOrNull(b.spinnerPlantel.selectedItemPosition)
        val campania = b.editCampania.text.toString().trim()
        val galpon = b.editGalpon.text.toString().trim()
        val corral = b.editCorral.text.toString().trim()
        val edadStr = b.editEdad.text.toString().trim()
        val linea = LINEAS_GENETICAS.getOrNull(b.spinnerLinea.selectedItemPosition) ?: LINEAS_GENETICAS.first()

        if (plantel == null || campania.isEmpty() || galpon.isEmpty() || corral.isEmpty()
            || edadStr.isEmpty()) {
            showError(getString(R.string.error_setup_fields_required))
            return
        }

        val edad = edadStr.toIntOrNull()
        if (edad == null || edad <= 0) {
            showError(getString(R.string.error_setup_fields_required))
            return
        }

        val categoria = when (b.radioGroupCategoria.checkedRadioButtonId) {
            R.id.radioHembra -> "HEMBRA"
            R.id.radioMediano -> "MEDIANO"
            else -> "MACHO"
        }

        val lote = when (b.radioGroupLote.checkedRadioButtonId) {
            R.id.radioLoteA -> "A"
            else -> "J"
        }

        val nAvesPorPesada = b.spinnerNAvesPesada.selectedItemPosition + 1
        val soloCalidad = b.radioGroupModo.checkedRadioButtonId == R.id.radioModoCalidad

        findNavController().navigate(
            R.id.action_captureSetup_to_capture,
            bundleOf(
                ARG_PLANTEL_ID to plantel.id,
                ARG_PLANTEL_CODIGO to plantel.codigo,
                ARG_CAMPANIA to campania,
                ARG_GALPON to galpon,
                ARG_CORRAL to corral,
                ARG_CATEGORIA to categoria,
                ARG_EDAD to edad,
                ARG_LINEA to linea,
                ARG_LOTE to lote,
                ARG_N_AVES_PESADA to nAvesPorPesada,
                ARG_SOLO_CALIDAD to soloCalidad,
            ),
        )
    }

    private fun setLoading(loading: Boolean) {
        binding?.progressSetup?.visibility = if (loading) View.VISIBLE else View.GONE
        binding?.buttonStartCapture?.isEnabled = !loading
    }

    private fun showError(message: String) {
        binding?.textSetupError?.text = message
        binding?.textSetupError?.visibility = View.VISIBLE
    }

    // El catálogo respondió 401: el admin revocó o rotó el token desde /admin/usuarios.
    // No tiene sentido mostrar el error crudo -- se manda directo al login, igual que
    // CaptureFragment.onResume() hace cuando detecta la sesión muerta en pantalla.
    private fun forceReLogin() {
        AuthRepository(requireContext()).logout()
        Toast.makeText(requireContext(), getString(R.string.session_revoked_message), Toast.LENGTH_LONG).show()
        findNavController().navigate(R.id.action_captureSetup_to_login)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }

    companion object {
        const val ARG_PLANTEL_ID = "plantelId"
        const val ARG_PLANTEL_CODIGO = "plantelCodigo"
        const val ARG_CAMPANIA = "campania"
        const val ARG_GALPON = "galpon"
        const val ARG_CORRAL = "corral"
        const val ARG_CATEGORIA = "categoria"
        const val ARG_EDAD = "edad"
        const val ARG_LINEA = "linea"
        const val ARG_LOTE = "lote"
        const val ARG_N_AVES_PESADA = "nAvesPorPesada"
        const val ARG_SOLO_CALIDAD = "soloCalidad"

        /** Líneas genéticas disponibles (desplegable). Se guarda el texto tal cual en el registro. */
        val LINEAS_GENETICAS = listOf("ROSS", "COBB")

        private const val MILLIS_PER_HOUR = 3_600_000L
        private const val STALE_PENDING_THRESHOLD_HOURS = 12L
    }
}

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
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.databinding.FragmentSacaSetupBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.PlantelDto
import kotlinx.coroutines.launch

/**
 * Configuración del muestreo de saca: el lote (plantel, campaña, galpón, categoría, edad) y los
 * parámetros que valen para todas las pesadas (aves por jaba y tara). El cruce con la preventa se
 * hace por plantel-campaña-galpón-categoría, así que esos cuatro datos son los que importan.
 */
class SacaSetupFragment : Fragment() {

    private var binding: FragmentSacaSetupBinding? = null
    private var planteles: List<PlantelDto> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentSacaSetupBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding?.spinnerTipoJaba?.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            TIPOS_JABA,
        )
        cargarPlanteles()
        binding?.buttonStartSaca?.setOnClickListener { onComenzarClicked() }
    }

    private fun cargarPlanteles() {
        setLoading(true)
        viewLifecycleOwner.lifecycleScope.launch {
            val api = ApiClient.getInstance(requireContext())
            // Igual que en preventa: si no hay señal se usa el catálogo guardado, para poder
            // configurar la saca en la granja sin internet.
            val respuesta = runCatching { api.getCatalogos() }.getOrNull() ?: api.getCatalogosOffline()
            if (respuesta == null) {
                mostrarError(getString(R.string.error_load_planteles, "sin catálogo guardado"))
            } else {
                planteles = respuesta.planteles
                binding?.spinnerPlantelSaca?.adapter = ArrayAdapter(
                    requireContext(),
                    android.R.layout.simple_spinner_dropdown_item,
                    planteles.map { if (it.cliente != null) "${it.codigo} — ${it.cliente}" else it.codigo },
                )
            }
            setLoading(false)
        }
    }

    private fun onComenzarClicked() {
        val b = binding ?: return
        val plantel = planteles.getOrNull(b.spinnerPlantelSaca.selectedItemPosition)
        val campania = b.editCampaniaSaca.text.toString().trim()
        val galpon = b.editGalponSaca.text.toString().trim()
        val corral = b.editCorralSaca.text.toString().trim().uppercase()
        val edad = b.editEdadSaca.text.toString().trim().toIntOrNull()
        val avesPorJaba = b.editAvesPorJaba.text.toString().trim().toIntOrNull()
        val taraKg = b.editTaraJaba.text.toString().trim().replace(',', '.').toDoubleOrNull()

        if (plantel == null || campania.isEmpty() || galpon.isEmpty() || corral.isEmpty() ||
            avesPorJaba == null || avesPorJaba <= 0 || taraKg == null || taraKg < 0
        ) {
            mostrarError(getString(R.string.saca_error_campos))
            return
        }

        val categoria = when (b.radioGroupCategoriaSaca.checkedRadioButtonId) {
            R.id.radioSacaHembra -> "HEMBRA"
            R.id.radioSacaMediano -> "MEDIANO"
            else -> "MACHO"
        }

        findNavController().navigate(
            R.id.action_sacaSetup_to_sacaCapture,
            bundleOf(
                ARG_PLANTEL_ID to plantel.id,
                ARG_PLANTEL_CODIGO to plantel.codigo,
                ARG_CAMPANIA to campania,
                ARG_GALPON to galpon,
                ARG_CORRAL to corral,
                ARG_CATEGORIA to categoria,
                ARG_EDAD to (edad ?: 0),
                ARG_AVES_POR_JABA to avesPorJaba,
                // La tara se maneja en gramos hacia adentro, aunque se pida en kg.
                ARG_TARA_GRAMOS to taraKg * 1000.0,
                ARG_TIPO_JABA to (TIPOS_JABA.getOrNull(b.spinnerTipoJaba.selectedItemPosition) ?: ""),
            ),
        )
    }

    private fun setLoading(loading: Boolean) {
        binding?.progressSacaSetup?.visibility = if (loading) View.VISIBLE else View.GONE
        binding?.buttonStartSaca?.isEnabled = !loading
    }

    private fun mostrarError(mensaje: String) {
        binding?.textSacaSetupError?.text = mensaje
        binding?.textSacaSetupError?.visibility = View.VISIBLE
        Toast.makeText(requireContext(), mensaje, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }

    companion object {
        const val ARG_PLANTEL_ID = "sacaPlantelId"
        const val ARG_PLANTEL_CODIGO = "sacaPlantelCodigo"
        const val ARG_CAMPANIA = "sacaCampania"
        const val ARG_GALPON = "sacaGalpon"
        const val ARG_CORRAL = "sacaCorral"
        const val ARG_CATEGORIA = "sacaCategoria"
        const val ARG_EDAD = "sacaEdad"
        const val ARG_AVES_POR_JABA = "sacaAvesPorJaba"
        const val ARG_TARA_GRAMOS = "sacaTaraGramos"
        const val ARG_TIPO_JABA = "sacaTipoJaba"

        /** Tipos de jaba en uso; se guarda el texto tal cual en el muestreo. */
        val TIPOS_JABA = listOf("BASA", "NOVATEC", "COLORES")
    }
}

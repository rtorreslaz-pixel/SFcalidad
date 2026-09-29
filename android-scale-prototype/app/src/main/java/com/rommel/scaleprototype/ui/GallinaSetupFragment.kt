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
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.databinding.FragmentGallinaSetupBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ClienteDto
import com.rommel.scaleprototype.net.MaterialDto
import kotlinx.coroutines.launch

/**
 * Configuración del pesaje de gallina: los datos del despacho.
 *
 * A diferencia de preventa y saca, que muestrean un lote en granja, aquí la unidad es el
 * camión — cliente, guía y placa —, así que no se pide plantel ni galpón. La densidad se
 * establece una vez y vale para todas las tandas de jabas del despacho.
 */
class GallinaSetupFragment : Fragment() {

    private var binding: FragmentGallinaSetupBinding? = null
    private var clientes: List<ClienteDto> = emptyList()
    private var materiales: List<MaterialDto> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentGallinaSetupBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding?.buttonGallinaComenzar?.setOnClickListener { onComenzarClicked() }
        cargarCatalogo()
        mostrarPendientes()
    }

    private fun cargarCatalogo() {
        binding?.buttonGallinaComenzar?.isEnabled = false
        viewLifecycleOwner.lifecycleScope.launch {
            val api = ApiClient.getInstance(requireContext())
            // Igual que en preventa y saca: si no hay señal se usa el catálogo guardado, para
            // poder configurar el despacho en el local del cliente sin internet.
            val respuesta = runCatching { api.getCatalogos() }.getOrNull() ?: api.getCatalogosOffline()
            if (respuesta == null) {
                Toast.makeText(
                    requireContext(),
                    getString(R.string.gallina_error_catalogo, getString(R.string.offline_catalog_notice)),
                    Toast.LENGTH_LONG,
                ).show()
                return@launch
            }
            clientes = respuesta.clientes
            materiales = respuesta.materiales
            binding?.spinnerGallinaCliente?.adapter = ArrayAdapter(
                requireContext(),
                android.R.layout.simple_spinner_dropdown_item,
                clientes.map { it.nombre },
            )
            binding?.spinnerGallinaMaterial?.adapter = ArrayAdapter(
                requireContext(),
                android.R.layout.simple_spinner_dropdown_item,
                materiales.map { "${it.codigo} — ${it.descripcion}" },
            )
            if (materiales.isEmpty()) {
                // Sin materiales no se puede pesar: el catálogo lo carga el supervisor en la web.
                Toast.makeText(requireContext(), R.string.gallina_error_sin_material, Toast.LENGTH_LONG).show()
            }
            binding?.buttonGallinaComenzar?.isEnabled = clientes.isNotEmpty() && materiales.isNotEmpty()
        }
    }

    /** Aviso de despachos que quedaron sin subir, para que no se cierre la jornada sin ellos. */
    private fun mostrarPendientes() {
        viewLifecycleOwner.lifecycleScope.launch {
            val pendientes = AppDatabase.getInstance(requireContext()).gallinaDao().countUnsynced()
            binding?.textGallinaPendientes?.apply {
                visibility = if (pendientes > 0) View.VISIBLE else View.GONE
                text = getString(R.string.gallina_pendientes_format, pendientes)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        mostrarPendientes()
    }

    private fun onComenzarClicked() {
        val b = binding ?: return
        val guia = b.editGallinaGuia.text.toString().trim()
        val placa = b.editGallinaPlaca.text.toString().trim().uppercase()
        val densidad = b.editGallinaDensidad.text.toString().trim().toIntOrNull()
        val cliente = clientes.getOrNull(b.spinnerGallinaCliente.selectedItemPosition)
        val material = materiales.getOrNull(b.spinnerGallinaMaterial.selectedItemPosition)

        if (guia.isEmpty() || placa.isEmpty() || densidad == null || densidad <= 0 ||
            cliente == null || material == null
        ) {
            Toast.makeText(requireContext(), R.string.gallina_error_campos, Toast.LENGTH_SHORT).show()
            return
        }

        findNavController().navigate(
            R.id.action_gallinaSetup_to_gallinaCapture,
            bundleOf(
                ARG_CLIENTE_ID to cliente.id,
                ARG_CLIENTE_NOMBRE to cliente.nombre,
                ARG_MATERIAL_ID to material.id,
                ARG_MATERIAL_CODIGO to material.codigo,
                ARG_MATERIAL_DESC to material.descripcion,
                ARG_GUIA to guia,
                ARG_PLACA to placa,
                ARG_DENSIDAD to densidad,
            ),
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }

    companion object {
        const val ARG_CLIENTE_ID = "gallinaClienteId"
        const val ARG_CLIENTE_NOMBRE = "gallinaClienteNombre"
        const val ARG_MATERIAL_ID = "gallinaMaterialId"
        const val ARG_MATERIAL_CODIGO = "gallinaMaterialCodigo"
        const val ARG_MATERIAL_DESC = "gallinaMaterialDesc"
        const val ARG_GUIA = "gallinaGuia"
        const val ARG_PLACA = "gallinaPlaca"
        const val ARG_DENSIDAD = "gallinaDensidad"
    }
}

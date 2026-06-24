package com.rommel.scaleprototype.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.databinding.FragmentCaptureSetupBinding
import com.rommel.scaleprototype.net.ApiClient
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
        loadPlanteles()
        binding?.buttonStartCapture?.setOnClickListener { onStartCaptureClicked() }
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
                    planteles.map { "${it.codigo} — ${it.cliente}" },
                )
            } catch (e: Exception) {
                showError(getString(R.string.error_load_planteles))
            } finally {
                setLoading(false)
            }
        }
    }

    private fun onStartCaptureClicked() {
        val b = binding ?: return
        val plantel = planteles.getOrNull(b.spinnerPlantel.selectedItemPosition)
        val galpon = b.editGalpon.text.toString().trim()
        val corral = b.editCorral.text.toString().trim()

        if (plantel == null || galpon.isEmpty() || corral.isEmpty()) {
            showError(getString(R.string.error_setup_fields_required))
            return
        }

        val categoria = when (b.radioGroupCategoria.checkedRadioButtonId) {
            R.id.radioHembra -> "HEMBRA"
            R.id.radioMediano -> "MEDIANO"
            else -> "MACHO"
        }

        findNavController().navigate(
            R.id.action_captureSetup_to_capture,
            bundleOf(
                ARG_PLANTEL_ID to plantel.id,
                ARG_PLANTEL_CODIGO to plantel.codigo,
                ARG_GALPON to galpon,
                ARG_CORRAL to corral,
                ARG_CATEGORIA to categoria,
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

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }

    companion object {
        const val ARG_PLANTEL_ID = "plantelId"
        const val ARG_PLANTEL_CODIGO = "plantelCodigo"
        const val ARG_GALPON = "galpon"
        const val ARG_CORRAL = "corral"
        const val ARG_CATEGORIA = "categoria"
    }
}

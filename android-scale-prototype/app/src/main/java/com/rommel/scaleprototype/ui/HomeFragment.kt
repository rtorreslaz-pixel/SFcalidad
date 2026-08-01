package com.rommel.scaleprototype.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.databinding.FragmentHomeBinding
import kotlinx.coroutines.launch

/**
 * Primera pantalla tras iniciar sesión: el verificador elige qué va a levantar hoy.
 *  - Pesaje preventa / calidad: aves individuales en granja (~35 días).
 *  - Pesaje de saca: muestreo de jabas antes de la saca diaria (~40+ días).
 */
class HomeFragment : Fragment() {

    private var binding: FragmentHomeBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding?.buttonPreventa?.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_captureSetup)
        }
        binding?.buttonSaca?.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_sacaSetup)
        }
        avisarSacaPendiente()
    }

    /** Si quedaron muestreos de saca sin subir, se avisa aquí para que no se olviden. */
    private fun avisarSacaPendiente() {
        val dao = AppDatabase.getInstance(requireContext()).sacaDao()
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                dao.countUnsyncedFlow().collect { count ->
                    val vista = binding?.textSacaPendientes ?: return@collect
                    if (count > 0) {
                        vista.visibility = View.VISIBLE
                        vista.text = getString(R.string.saca_pendientes_format, count)
                    } else {
                        vista.visibility = View.GONE
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }
}

package com.rommel.scaleprototype.ui

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.MuestreoDiaResumen
import com.rommel.scaleprototype.databinding.FragmentMuestreosBinding
import com.rommel.scaleprototype.databinding.ItemMuestreoBinding
import com.rommel.scaleprototype.sync.SyncScheduler
import kotlinx.coroutines.launch
import java.util.Calendar

/**
 * Registro de muestreos del día: lista cada lote muestreado hoy con su estado (completo o con
 * registros pendientes de enviar), para que el verificador controle qué le falta sincronizar.
 * Lee la base local (Room); los registros sincronizados no se borran, así que se ven completos
 * y pendientes.
 */
class MuestreosDiaFragment : Fragment() {

    private var binding: FragmentMuestreosBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentMuestreosBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding?.buttonVolver?.setOnClickListener { findNavController().popBackStack() }
        binding?.buttonSync?.setOnClickListener {
            SyncScheduler.scheduleSyncNow(requireContext())
            Toast.makeText(requireContext(), R.string.action_sync_pendientes, Toast.LENGTH_SHORT).show()
        }
        cargar()
    }

    override fun onResume() {
        super.onResume()
        cargar() // refresca al volver (p. ej. tras sincronizar)
    }

    private fun cargar() {
        val dao = AppDatabase.getInstance(requireContext()).registroPesoDao()
        viewLifecycleOwner.lifecycleScope.launch {
            val muestreos = dao.muestreosDelDia(inicioDeHoyMillis())
            render(muestreos)
        }
    }

    private fun render(muestreos: List<MuestreoDiaResumen>) {
        val b = binding ?: return
        b.containerMuestreos.removeAllViews()
        b.textVacio.visibility = if (muestreos.isEmpty()) View.VISIBLE else View.GONE

        val totalAves = muestreos.sumOf { it.total }
        val totalPendientes = muestreos.sumOf { it.pendientes }
        val estadoGlobal = if (totalPendientes == 0) {
            getString(R.string.muestreos_todo_sincronizado)
        } else {
            getString(R.string.muestreos_pendientes_format, totalPendientes)
        }
        b.textResumen.text = getString(R.string.muestreos_resumen_format, muestreos.size, totalAves, estadoGlobal)

        val inflater = LayoutInflater.from(requireContext())
        for (m in muestreos) {
            val row = ItemMuestreoBinding.inflate(inflater, b.containerMuestreos, false)
            row.textLote.text = "${m.plantelCodigo} · ${m.campania} · G${m.galpon} · ${m.corral} · ${m.categoria}"
            row.textDetalle.text = getString(R.string.muestreo_item_detalle, m.total)
            if (m.pendientes > 0) {
                row.textEstado.text = getString(R.string.muestreo_por_enviar_format, m.pendientes)
                row.textEstado.setTextColor(Color.parseColor("#B45309"))
            } else {
                row.textEstado.text = getString(R.string.muestreo_completo)
                row.textEstado.setTextColor(Color.parseColor("#16A34A"))
            }
            b.containerMuestreos.addView(row.root)
        }
    }

    private fun inicioDeHoyMillis(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }
}

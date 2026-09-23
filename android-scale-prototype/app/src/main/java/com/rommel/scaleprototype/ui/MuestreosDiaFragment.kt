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
import com.rommel.scaleprototype.data.HistorialCorral
import com.rommel.scaleprototype.databinding.FragmentMuestreosBinding
import com.rommel.scaleprototype.databinding.ItemHistorialDiaBinding
import com.rommel.scaleprototype.databinding.ItemHistorialGalponBinding
import com.rommel.scaleprototype.databinding.ItemMuestreoBinding
import com.rommel.scaleprototype.sync.SyncScheduler
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Historial de pesajes guardados en el teléfono: día por día, con el consolidado de cada
 * galpón y el detalle de sus corrales (aves y promedio por ave).
 *
 * Los registros no se borran al sincronizar, así que aquí se ven también los muestreos ya
 * enviados: el verificador puede cerrar la app y volver a consultar lo que pesó, que era
 * justo lo que no se podía hacer antes (solo se listaba el día en curso).
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
            render(dao.historialPorCorral())
        }
    }

    private fun render(filas: List<HistorialCorral>) {
        val b = binding ?: return
        b.containerMuestreos.removeAllViews()
        b.textVacio.visibility = if (filas.isEmpty()) View.VISIBLE else View.GONE

        val totalAves = filas.sumOf { it.aves }
        val totalPendientes = filas.sumOf { it.pendientes }
        val dias = filas.map { it.dia }.distinct().size
        b.textResumen.text = if (filas.isEmpty()) {
            ""
        } else {
            val estado = if (totalPendientes == 0) {
                getString(R.string.muestreos_todo_sincronizado)
            } else {
                getString(R.string.muestreos_pendientes_format, totalPendientes)
            }
            getString(R.string.historial_resumen_format, dias, totalAves, estado)
        }

        val inflater = LayoutInflater.from(requireContext())
        // La consulta ya viene ordenada por día (más reciente primero) y luego por galpón,
        // así que basta con recorrerla e ir abriendo encabezados cuando cambia el grupo.
        for ((dia, delDia) in filas.groupBy { it.dia }) {
            val cabecera = ItemHistorialDiaBinding.inflate(inflater, b.containerMuestreos, false)
            cabecera.textHistorialDia.text = diaLegible(dia)
            b.containerMuestreos.addView(cabecera.root)

            val porGalpon = delDia.groupBy { Triple(it.plantelCodigo, it.campania, it.galpon) }
            for ((clave, corrales) in porGalpon) {
                val (plantel, campania, galpon) = clave
                val fila = ItemHistorialGalponBinding.inflate(inflater, b.containerMuestreos, false)
                fila.textGalponTitulo.text = getString(R.string.historial_galpon_format, plantel, campania, galpon)
                fila.textGalponResumen.text = resumen(
                    corrales.sumOf { it.aves },
                    corrales.sumOf { it.avesPesadas },
                    corrales.sumOf { it.pesoTotal },
                )
                b.containerMuestreos.addView(fila.root)

                for (c in corrales) pintarCorral(inflater, b.containerMuestreos, c)
            }
        }
    }

    private fun pintarCorral(inflater: LayoutInflater, destino: ViewGroup, c: HistorialCorral) {
        val row = ItemMuestreoBinding.inflate(inflater, destino, false)
        row.textLote.text = getString(R.string.historial_corral_format, c.corral, sexoLegible(c.categoria))
        row.textDetalle.text = resumen(c.aves, c.avesPesadas, c.pesoTotal)
        if (c.pendientes > 0) {
            row.textEstado.text = getString(R.string.muestreo_por_enviar_format, c.pendientes)
            row.textEstado.setTextColor(Color.parseColor("#B45309"))
        } else {
            row.textEstado.text = getString(R.string.muestreo_completo)
            row.textEstado.setTextColor(Color.parseColor("#16A34A"))
        }
        destino.addView(row.root)
    }

    /** "24 aves · 2465 g/ave", o solo las aves si ese corral fue de solo calidad. */
    private fun resumen(aves: Int, avesPesadas: Int, pesoTotal: Double): String {
        if (avesPesadas <= 0) return getString(R.string.historial_solo_calidad_format, aves)
        val promedio = Math.round(pesoTotal / avesPesadas).toInt()
        return getString(R.string.historial_resumen_corral_format, aves, promedio)
    }

    private fun sexoLegible(categoria: String): String = when (categoria) {
        "HEMBRA" -> getString(R.string.categoria_hembra)
        "MEDIANO" -> getString(R.string.categoria_mediano)
        else -> getString(R.string.categoria_macho)
    }

    /** "2026-09-16" -> "martes 16 de septiembre". Si no parsea, se muestra tal cual. */
    private fun diaLegible(dia: String): String = runCatching {
        val fecha = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(dia)!!
        SimpleDateFormat("EEEE d 'de' MMMM", Locale("es", "PE")).format(fecha)
    }.getOrDefault(dia)

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }
}

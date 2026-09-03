package com.rommel.scaleprototype.ui

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Última configuración de muestreo, para dar continuidad entre corrales.
 *
 * Un galpón tiene 4 corrales (A-D) y entre uno y otro solo cambia el corral: el plantel, la
 * campaña, el galpón, la edad, la línea, el lote y las aves por pesada son los mismos. Antes había
 * que reescribir los nueve campos en cada corral; ahora se guarda lo último usado y la pantalla
 * vuelve a aparecer llena, con el corral ya avanzado al siguiente. Todo sigue siendo editable.
 */
data class ConfiguracionMuestreo(
    val verificadorId: String,
    val plantelId: String,
    val campania: String,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val edad: Int,
    val linea: String,
    val lote: String,
    val nAvesPorPesada: Int,
    val soloCalidad: Boolean,
    /** Día en que se guardó (yyyy-MM-dd): la edad de las aves no sirve al día siguiente. */
    val dia: String,
)

object ConfiguracionMuestreoStore {

    /** Los 4 corrales de un galpón. */
    val CORRALES = listOf("A", "B", "C", "D")

    /** Opción del selector para un galpón que no use la nomenclatura A-D. */
    const val CORRAL_OTRO = "Otro…"

    private const val PREFS = "muestreo_prefs"

    fun guardar(context: Context, cfg: ConfiguracionMuestreo) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("verificadorId", cfg.verificadorId)
            .putString("plantelId", cfg.plantelId)
            .putString("campania", cfg.campania)
            .putString("galpon", cfg.galpon)
            .putString("corral", cfg.corral)
            .putString("categoria", cfg.categoria)
            .putInt("edad", cfg.edad)
            .putString("linea", cfg.linea)
            .putString("lote", cfg.lote)
            .putInt("nAvesPorPesada", cfg.nAvesPorPesada)
            .putBoolean("soloCalidad", cfg.soloCalidad)
            .putString("dia", cfg.dia)
            .apply()
    }

    /**
     * Devuelve la configuración guardada, o null si no hay ninguna o si es de OTRO verificador
     * (teléfono compartido: al siguiente no debe aparecerle el lote del anterior).
     */
    fun leer(context: Context, verificadorId: String?): ConfiguracionMuestreo? {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val plantelId = p.getString("plantelId", null) ?: return null
        val dueño = p.getString("verificadorId", null)
        if (dueño != null && verificadorId != null && dueño != verificadorId) return null
        return ConfiguracionMuestreo(
            verificadorId = dueño ?: "",
            plantelId = plantelId,
            campania = p.getString("campania", "") ?: "",
            galpon = p.getString("galpon", "") ?: "",
            corral = p.getString("corral", "") ?: "",
            categoria = p.getString("categoria", "MACHO") ?: "MACHO",
            edad = p.getInt("edad", 0),
            linea = p.getString("linea", "") ?: "",
            lote = p.getString("lote", "J") ?: "J",
            nAvesPorPesada = p.getInt("nAvesPorPesada", 1),
            soloCalidad = p.getBoolean("soloCalidad", false),
            dia = p.getString("dia", "") ?: "",
        )
    }

    fun limpiar(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }

    /**
     * Marca que el corral se dio por terminado, para que la pantalla de configuración proponga
     * el siguiente. Sin esto, entrar por "Cambiar" a mitad de un muestreo —para corregir el
     * galpón, por ejemplo— movería el corral sin que nadie lo pidiera.
     */
    fun marcarCorralCompletado(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("corralCompletado", true).apply()
    }

    /** Devuelve si el último corral se completó y baja la marca. */
    fun consumirCorralCompletado(context: Context): Boolean {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val completado = p.getBoolean("corralCompletado", false)
        if (completado) p.edit().putBoolean("corralCompletado", false).apply()
        return completado
    }

    fun hoy(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    /**
     * Corral que toca después de [actual]: A→B→C→D y, terminado el galpón, vuelve a A (para
     * entonces normalmente se cambia de galpón, así que se propone y ya). Si el corral anterior
     * no era uno de los cuatro, no se adivina nada.
     */
    fun siguienteCorral(actual: String?): String? {
        val i = CORRALES.indexOf(actual?.trim()?.uppercase())
        if (i < 0) return null
        return CORRALES[(i + 1) % CORRALES.size]
    }
}

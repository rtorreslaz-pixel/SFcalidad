package com.rommel.scaleprototype.net

import android.content.Context

/**
 * Última respuesta buena de `/api/mobile/catalogos`, guardada como JSON crudo.
 *
 * Permite configurar una jornada SIN señal (granjas sin cobertura): si la descarga del
 * catálogo falla, la pantalla de configuración usa este respaldo. Se refresca en cada
 * descarga exitosa, así que a lo sumo queda tan desactualizado como la última vez que
 * el teléfono tuvo internet — suficiente para planteles, que cambian poco.
 */
class CatalogCache(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun save(rawJson: String) {
        prefs.edit()
            .putString(KEY_JSON, rawJson)
            .putLong(KEY_SAVED_AT_MILLIS, System.currentTimeMillis())
            .apply()
    }

    fun load(): String? = prefs.getString(KEY_JSON, null)

    fun savedAtMillis(): Long = prefs.getLong(KEY_SAVED_AT_MILLIS, 0L)

    companion object {
        private const val PREFS_NAME = "catalog_cache"
        private const val KEY_JSON = "catalogos_json"
        private const val KEY_SAVED_AT_MILLIS = "saved_at_millis"
    }
}

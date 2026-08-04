package com.rommel.scaleprototype

/**
 * Elige, a partir de las líneas que la báscula está mandando de verdad, qué protocolo sabe
 * leerlas — para cuando el seleccionado no las reconoce.
 *
 * Existe porque el fallo era mudo: si el protocolo elegido no encaja con la trama, `parse()`
 * devuelve null en cada línea y la pantalla de pesaje se queda en "-- kg" sin explicar nada,
 * indistinguible de "la báscula no manda nada".
 *
 * Reglas deliberadas:
 * - Solo se adoptan protocolos **específicos de marca** ([ScaleProtocols.autodetectables]); el
 *   genérico se excluye porque acepta casi cualquier línea con un número y elegiría cualquier
 *   cosa (un `S995` de la BIT PS lo leería como 995 kg).
 * - Se exige que el candidato acierte varias líneas seguidas, no una: una coincidencia suelta
 *   puede ser casualidad.
 */
object DeteccionProtocolo {

    /** Líneas consecutivas sin interpretar antes de sospechar del protocolo elegido. */
    const val MIN_LINEAS_SIN_INTERPRETAR = 5

    /** Cuántas de las líneas recientes debe entender un candidato para adoptarlo. */
    const val MIN_ACIERTOS = 3

    /** Cuántas líneas recientes se guardan para la comparación. */
    const val MAX_LINEAS_RECIENTES = 12

    /**
     * Devuelve el índice del protocolo que sí entiende [lineas], o null si ninguno califica
     * (entonces no se toca nada: el problema no es el protocolo).
     */
    fun elegir(lineas: List<String>, protocoloActual: Int): Int? {
        if (lineas.size < MIN_ACIERTOS) return null
        return ScaleProtocols.autodetectables
            .filter { it != protocoloActual }
            .firstOrNull { indice ->
                val protocolo = ScaleProtocols.all[indice]
                lineas.count { protocolo.parse(it) != null } >= MIN_ACIERTOS
            }
    }
}

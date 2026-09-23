package com.rommel.scaleprototype.ui

/**
 * Estándares de muestreo de la empresa. Son los valores que la app propone sola al elegir el
 * tipo de muestreo; el verificador puede cambiarlos en pantalla si un caso lo amerita.
 *
 * - Pesaje de preventa: aves de UNA en una (agrupamiento individual).
 * - Calidad: de a TRES aves por registro (agrupamiento grupal).
 */
object EstandaresMuestreo {
    const val TIPO_PREVENTA = "PREVENTA"
    const val TIPO_CALIDAD = "CALIDAD"

    const val AVES_POR_PESADA_PREVENTA = 1
    const val AVES_POR_PESADA_CALIDAD = 3

    /** INDIVIDUAL o GRUPAL según el tipo. */
    fun agrupamientoPara(tipo: String): String =
        if (tipo == TIPO_CALIDAD) "GRUPAL" else "INDIVIDUAL"

    /** Aves por pesada/registro según el tipo. */
    fun avesPorPesadaPara(tipo: String): Int =
        if (tipo == TIPO_CALIDAD) AVES_POR_PESADA_CALIDAD else AVES_POR_PESADA_PREVENTA

    /** Tope del selector de aves por pesada (mismo rango que admite el plan del día). */
    const val MAX_AVES_POR_PESADA = 20

    /**
     * Peso por ave a partir de lo que marca la balanza y de cuántas aves hay EN ELLA.
     *
     * Se divide entre las aves de esa pesada concreta, no entre el estándar del muestreo: al
     * cerrar un corral que se pesó de 3 en 3 suelen quedar 1 o 2 aves sueltas, y dividirlas
     * entre 3 las registraría con un tercio de su peso.
     *
     * [aves] se acota a un valor sensato para que un dato raro no produzca un peso absurdo
     * ni una división por cero.
     */
    fun pesoPorAveGramos(pesoTotalKg: Double, aves: Int): Double =
        (pesoTotalKg * 1000.0) / aves.coerceIn(1, MAX_AVES_POR_PESADA)
}

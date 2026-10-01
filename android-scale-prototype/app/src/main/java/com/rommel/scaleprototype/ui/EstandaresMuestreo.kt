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
     * Resumen de un muestreo de preventa/calidad: cuántas aves lleva y a cuánto salen.
     *
     * Una lectura grupal vale por SUS aves, así que el promedio se pondera por ellas en vez
     * de promediar lecturas: tres aves de 2600 g y una suelta de 2000 g dan 2450, no 2300.
     * Las anuladas y las de solo calidad no entran al promedio, aunque las anuladas tampoco
     * cuentan como aves.
     *
     * @param lecturas pares (peso por ave en gramos, aves de esa lectura, anulada)
     */
    fun resumirMuestreo(lecturas: List<Triple<Double, Int, Boolean>>): ResumenMuestreo {
        val vigentes = lecturas.filterNot { it.third }
        val aves = vigentes.sumOf { aves(it.second) }
        val conPeso = vigentes.filter { it.first > 0 }
        val avesConPeso = conPeso.sumOf { aves(it.second) }
        val suma = conPeso.sumOf { it.first * aves(it.second) }
        return ResumenMuestreo(
            aves = aves,
            promedioGramos = if (avesConPeso > 0) suma / avesConPeso else null,
        )
    }

    private fun aves(n: Int): Int = if (n > 1) n else 1

    data class ResumenMuestreo(val aves: Int, val promedioGramos: Double?)

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

package com.rommel.scaleprototype.ui

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Peso por ave en el pesaje grupal.
 *
 * El caso que motiva estas pruebas: se pesa de 3 en 3, pero el corral cierra con 1 o 2 aves.
 * Si esas últimas se siguieran dividiendo entre 3, quedarían registradas con un tercio de su
 * peso y arrastrarían el promedio del corral hacia abajo.
 */
class PesoPorAveTest {

    @Test
    fun `una sola ave pesa lo que marca la balanza`() {
        assertEquals(2480.0, EstandaresMuestreo.pesoPorAveGramos(2.480, aves = 1), 0.001)
    }

    @Test
    fun `tres aves juntas reparten el total`() {
        assertEquals(2500.0, EstandaresMuestreo.pesoPorAveGramos(7.500, aves = 3), 0.001)
    }

    @Test
    fun `la ultima ave suelta conserva su peso entero`() {
        // 2.6 kg de UNA ave: con la densidad fija en 3 habría quedado en 866,7 g.
        assertEquals(2600.0, EstandaresMuestreo.pesoPorAveGramos(2.600, aves = 1), 0.001)
        assertEquals(866.67, EstandaresMuestreo.pesoPorAveGramos(2.600, aves = 3), 0.01)
    }

    @Test
    fun `dos aves sueltas al cerrar el corral`() {
        assertEquals(2500.0, EstandaresMuestreo.pesoPorAveGramos(5.000, aves = 2), 0.001)
    }

    @Test
    fun `un cero o un negativo no divide por cero`() {
        assertEquals(2480.0, EstandaresMuestreo.pesoPorAveGramos(2.480, aves = 0), 0.001)
        assertEquals(2480.0, EstandaresMuestreo.pesoPorAveGramos(2.480, aves = -5), 0.001)
    }

    @Test
    fun `no se acepta un numero de aves fuera del rango del plan`() {
        val tope = EstandaresMuestreo.MAX_AVES_POR_PESADA
        assertEquals(
            EstandaresMuestreo.pesoPorAveGramos(50.0, aves = tope),
            EstandaresMuestreo.pesoPorAveGramos(50.0, aves = tope + 10),
            0.001,
        )
    }

    @Test
    fun `el estandar de calidad sigue siendo de tres aves`() {
        assertEquals(3, EstandaresMuestreo.avesPorPesadaPara(EstandaresMuestreo.TIPO_CALIDAD))
        assertEquals(1, EstandaresMuestreo.avesPorPesadaPara(EstandaresMuestreo.TIPO_PREVENTA))
    }
}

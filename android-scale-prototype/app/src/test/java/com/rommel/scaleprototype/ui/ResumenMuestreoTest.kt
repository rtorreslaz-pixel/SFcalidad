package com.rommel.scaleprototype.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Totales de la lista de preventa/calidad.
 *
 * Lo delicado es que una lectura grupal vale por SUS aves: promediar lecturas en vez de aves
 * da un número distinto, y es el que el verificador compara contra el estándar del lote.
 */
class ResumenMuestreoTest {

    /** (peso por ave, aves de la lectura, anulada) */
    private fun l(peso: Double, aves: Int = 1, anulada: Boolean = false) = Triple(peso, aves, anulada)

    @Test
    fun `aves individuales promedian normal`() {
        val r = EstandaresMuestreo.resumirMuestreo(listOf(l(2400.0), l(2500.0), l(2600.0)))
        assertEquals(3, r.aves)
        assertEquals(2500.0, r.promedioGramos!!, 0.01)
    }

    @Test
    fun `una lectura grupal cuenta todas sus aves`() {
        val r = EstandaresMuestreo.resumirMuestreo(listOf(l(2600.0, aves = 3)))
        assertEquals(3, r.aves)
        assertEquals(2600.0, r.promedioGramos!!, 0.01)
    }

    /** El caso que motiva ponderar: 3 aves a 2600 y una suelta a 2000. */
    @Test
    fun `el promedio se pondera por aves, no por lecturas`() {
        val r = EstandaresMuestreo.resumirMuestreo(listOf(l(2600.0, aves = 3), l(2000.0)))
        assertEquals(4, r.aves)
        // ponderado: (3*2600 + 2000) / 4 = 2450. Promediando lecturas daría 2300.
        assertEquals(2450.0, r.promedioGramos!!, 0.01)
        assertEquals(2300.0, (2600.0 + 2000.0) / 2, 0.01)
    }

    @Test
    fun `una anulada no cuenta ni como ave ni en el promedio`() {
        val r = EstandaresMuestreo.resumirMuestreo(
            listOf(l(2500.0), l(500.0, anulada = true), l(2600.0))
        )
        assertEquals(2, r.aves)
        assertEquals(2550.0, r.promedioGramos!!, 0.01)
    }

    @Test
    fun `anular una lectura grupal descuenta todas sus aves`() {
        val r = EstandaresMuestreo.resumirMuestreo(
            listOf(l(2600.0, aves = 3, anulada = true), l(2400.0))
        )
        assertEquals(1, r.aves)
        assertEquals(2400.0, r.promedioGramos!!, 0.01)
    }

    @Test
    fun `solo calidad cuenta aves pero no entra al promedio`() {
        val r = EstandaresMuestreo.resumirMuestreo(listOf(l(2500.0), l(0.0)))
        assertEquals(2, r.aves)
        assertEquals(2500.0, r.promedioGramos!!, 0.01)
    }

    @Test
    fun `un muestreo de solo calidad no reporta promedio`() {
        val r = EstandaresMuestreo.resumirMuestreo(listOf(l(0.0), l(0.0)))
        assertEquals(2, r.aves)
        assertNull(r.promedioGramos)
    }

    @Test
    fun `sin lecturas no hay aves ni promedio`() {
        val r = EstandaresMuestreo.resumirMuestreo(emptyList())
        assertEquals(0, r.aves)
        assertNull(r.promedioGramos)
    }
}

package com.rommel.scaleprototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Fija el respaldo que evita el fallo mudo de campo: la pantalla de Ajustes mostraba el peso y la
 * de pesaje se quedaba en "-- kg" porque interpretaba con otro protocolo. Si el elegido no
 * entiende lo que manda la báscula, se adopta el que sí — pero solo con evidencia suficiente.
 */
class DeteccionProtocoloTest {

    /** Tramas reales de la BIT PS 4.0 (`<U|S><gramos>`) capturadas de la báscula física. */
    private val tramasBitPs = listOf("U390", "U625", "U815", "U980", "S995", "S995")

    private val indiceBitPs = ScaleProtocols.all.indexOfFirst { it is BitPs40Protocol }
    private val indiceGenerico = ScaleProtocols.all.indexOfFirst { it is GenericRegexProtocol }
    private val indiceOhaus = ScaleProtocols.all.indexOfFirst { it is OhausRangerProtocol }

    @Test
    fun `adopta BIT PS cuando el protocolo elegido no entiende sus tramas`() {
        // Este es el caso reportado: quedó seleccionado Ohaus y llegan tramas de la BIT PS.
        assertEquals(indiceBitPs, DeteccionProtocolo.elegir(tramasBitPs, indiceOhaus))
    }

    @Test
    fun `no cambia nada si el protocolo en uso ya es el correcto`() {
        // Se excluye el actual: si ya es el bueno, ningún otro debe "ganarle" y provocar vaivenes.
        assertNull(DeteccionProtocolo.elegir(tramasBitPs, indiceBitPs))
    }

    @Test
    fun `nunca adopta el generico porque acepta casi cualquier numero`() {
        assertFalse(ScaleProtocols.autodetectables.contains(indiceGenerico))
    }

    @Test
    fun `no decide con basura que ningun protocolo entiende`() {
        val ruido = listOf("???", "---", "conectado", "xyz", "***", "ERR")
        assertNull(DeteccionProtocolo.elegir(ruido, indiceOhaus))
    }

    @Test
    fun `no decide con una sola coincidencia suelta`() {
        // Una línea aislada puede ser casualidad: hacen falta MIN_ACIERTOS.
        assertNull(DeteccionProtocolo.elegir(listOf("S995"), indiceOhaus))
    }

    @Test
    fun `exige varias coincidencias antes de cambiar`() {
        val justoPorDebajo = listOf("S995", "S995", "basura", "basura")
        assertNull(DeteccionProtocolo.elegir(justoPorDebajo, indiceOhaus))

        val justo = listOf("S995", "S995", "S995", "basura")
        assertEquals(indiceBitPs, DeteccionProtocolo.elegir(justo, indiceOhaus))
    }
}

package com.rommel.scaleprototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Casos canónicos de la BIT PS 4.0 IoT. Los del bloque "trama real" corresponden a una captura
 * de la báscula física (dispositivo `scale-2413-0214`), formato `<U|S><gramos>`; el resto fija
 * la heurística de respaldo para tramas que no coincidan con ese formato.
 */
class BitPs40ProtocolTest {

    private val protocol = BitPs40Protocol()

    // --- Trama real capturada: <estado><gramos>, S=estable / U=inestable ---

    @Test
    fun `stable frame parses grams to kg and marks stable`() {
        val result = protocol.parse("S1460")
        assertEquals(1.460, result!!.value, 0.000001)
        assertEquals("kg", result.unit)
        assertTrue(result.stable)
    }

    @Test
    fun `unstable frame is parsed but marked not stable`() {
        val result = protocol.parse("U1440")
        assertEquals(1.440, result!!.value, 0.000001)
        assertFalse(result.stable)
    }

    @Test
    fun `zero frame parses to zero`() {
        assertEquals(0.0, protocol.parse("U0")!!.value, 0.000001)
    }

    @Test
    fun `captured ramp keeps values monotonic in kg`() {
        // U5, U10, U45, U225, U520, U755, U1085 -> 0.005 … 1.085 kg
        assertEquals(0.005, protocol.parse("U5")!!.value, 0.000001)
        assertEquals(0.045, protocol.parse("U45")!!.value, 0.000001)
        assertEquals(0.520, protocol.parse("U520")!!.value, 0.000001)
        assertEquals(1.085, protocol.parse("U1085")!!.value, 0.000001)
    }

    @Test
    fun `state frame tolerates trailing control chars from framing`() {
        assertEquals(1.460, protocol.parse("S1460\r")!!.value, 0.000001)
    }

    // --- Heurística de respaldo (tramas que no son <U|S><entero>) ---

    @Test
    fun `parses weight with dot decimal and kg unit`() {
        val result = protocol.parse("2.345 kg")
        assertEquals(2.345, result!!.value, 0.000001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses german comma decimal`() {
        assertEquals(2.345, protocol.parse("2,345 kg")!!.value, 0.000001)
    }

    @Test
    fun `parses grams unit and converts to kg`() {
        assertEquals(2.345, protocol.parse("2345 g")!!.value, 0.000001)
    }

    @Test
    fun `bare integer is interpreted as grams`() {
        assertEquals(2.345, protocol.parse("2345")!!.value, 0.000001)
    }

    @Test
    fun `bare decimal is interpreted as kg`() {
        assertEquals(3.5, protocol.parse("3.5")!!.value, 0.000001)
    }

    @Test
    fun `small bare integer is interpreted as kg`() {
        assertEquals(12.0, protocol.parse("12")!!.value, 0.000001)
    }

    @Test
    fun `prefers the number with explicit unit over a bare counter`() {
        // "No. 15" es un contador de muestra; el peso real es el que trae unidad.
        assertEquals(2.345, protocol.parse("No. 15  2345 g")!!.value, 0.000001)
    }

    @Test
    fun `parses negative tare`() {
        assertEquals(-0.050, protocol.parse("-0.050 kg")!!.value, 0.000001)
    }

    @Test
    fun `parses comma separated frame in mettler style`() {
        assertEquals(2.345, protocol.parse("ST,GS,+2.345kg")!!.value, 0.000001)
    }

    @Test
    fun `ignores control characters around the weight`() {
        assertEquals(2.345, protocol.parse("\u0002 2.345 kg\r")!!.value, 0.000001)
    }

    @Test
    fun `parses labeled weight after a colon`() {
        assertEquals(2.345, protocol.parse("Peso: 2.345 kg")!!.value, 0.000001)
    }

    @Test
    fun `returns null for times dates serials and versions`() {
        assertNull(protocol.parse("12:34:56"))
        assertNull(protocol.parse("01/02/2026"))
        assertNull(protocol.parse("SCALE-2023-0123"))
        assertNull(protocol.parse("v1.2.3"))
    }

    @Test
    fun `returns null for values outside poultry range`() {
        // "123456" como gramos serían 123.456 kg: fuera de rango avícola -> descartado.
        assertNull(protocol.parse("123456"))
    }

    @Test
    fun `returns null for empty or non numeric lines`() {
        assertNull(protocol.parse(""))
        assertNull(protocol.parse("READY"))
    }

    @Test
    fun `word starting with g is not treated as a unit`() {
        // "gramos" no es la unidad "g": el token decimal sin unidad se asume kg.
        assertEquals(2.345, protocol.parse("2.345 gramos")!!.value, 0.000001)
    }
}

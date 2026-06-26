package com.rommel.scaleprototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TScaleBwProtocolTest {

    private val protocol = TScaleBwProtocol()

    /**
     * Construye una trama "Con2" como la que entrega [com.rommel.scaleprototype.ScaleBluetoothClient]
     * ya sin el CR LF final (el lector de líneas lo usa como separador, no como parte de la línea).
     */
    private fun frame(
        decimales: Int,
        digitosPeso: List<Int>,
        digitosTara: List<Int> = listOf(0, 0, 0, 0, 0, 0),
        negativo: Boolean = false,
        overload: Boolean = false,
        kg: Boolean = false,
        onzas: Boolean = false,
        digitosComoAscii: Boolean = true,
    ): String {
        var header2 = 0x20
        if (negativo) header2 = header2 or 0x02
        if (overload) header2 = header2 or 0x04
        if (kg) header2 = header2 or 0x10
        val header3 = if (onzas) 0x23 else 0x21

        val digitEncoder: (Int) -> Char = if (digitosComoAscii) {
            { d -> (0x30 + d).toChar() }
        } else {
            { d -> d.toChar() }
        }

        val sb = StringBuilder()
        sb.append(0x02.toChar())
        sb.append((0x22 + decimales).toChar())
        sb.append(header2.toChar())
        sb.append(header3.toChar())
        digitosPeso.forEach { sb.append(digitEncoder(it)) }
        digitosTara.forEach { sb.append(digitEncoder(it)) }
        return sb.toString()
    }

    @Test
    fun `parses ascii digits with two decimals in grams as kg`() {
        // 002105 con 2 decimales -> 21.05 (en gramos) -> 0.02105 kg
        val result = protocol.parse(frame(decimales = 2, digitosPeso = listOf(0, 0, 2, 1, 0, 5)))
        assertEquals(0.02105, result!!.value, 0.000001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses a realistic chicken weight in grams, zero decimals`() {
        // 002105 con 0 decimales -> 2105 g -> 2.105 kg
        val result = protocol.parse(frame(decimales = 0, digitosPeso = listOf(0, 0, 2, 1, 0, 5)))
        assertEquals(2.105, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses weight already flagged as kg without dividing by 1000`() {
        val result = protocol.parse(frame(decimales = 3, digitosPeso = listOf(0, 0, 2, 1, 0, 5), kg = true))
        assertEquals(2.105, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses ounces and converts to kg`() {
        // 000100 con 0 decimales -> 100 oz
        val result = protocol.parse(frame(decimales = 0, digitosPeso = listOf(0, 0, 0, 1, 0, 0), onzas = true))
        assertEquals(100 * 0.0283495231, result!!.value, 0.00001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses negative weight`() {
        val result = protocol.parse(frame(decimales = 0, digitosPeso = listOf(0, 0, 0, 0, 5, 0), negativo = true))
        assertEquals(-0.050, result!!.value, 0.0001)
    }

    @Test
    fun `parses raw binary digit nibbles instead of ascii`() {
        val result = protocol.parse(
            frame(decimales = 0, digitosPeso = listOf(0, 0, 2, 1, 0, 5), digitosComoAscii = false)
        )
        assertEquals(2.105, result!!.value, 0.0001)
    }

    @Test
    fun `returns null on overload`() {
        assertNull(protocol.parse(frame(decimales = 0, digitosPeso = listOf(0, 0, 0, 0, 0, 0), overload = true)))
    }

    @Test
    fun `returns null when header0 is not STX`() {
        val bad = "X" + frame(decimales = 0, digitosPeso = listOf(0, 0, 0, 0, 0, 0)).drop(1)
        assertNull(protocol.parse(bad))
    }

    @Test
    fun `returns null for lines too short or unrelated to this protocol`() {
        assertNull(protocol.parse(""))
        assertNull(protocol.parse("    0.420 kg"))
    }
}

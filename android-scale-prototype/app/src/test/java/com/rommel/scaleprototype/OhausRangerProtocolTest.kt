package com.rommel.scaleprototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OhausRangerProtocolTest {

    private val protocol = OhausRangerProtocol()

    @Test
    fun `parses stable weight with unit, right justified field`() {
        val result = protocol.parse("    0.420 kg")
        assertEquals(0.420, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses unstable weight carrying the question mark flag`() {
        val result = protocol.parse("    0.420 kg    ?")
        assertEquals(0.420, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses net weight line`() {
        val result = protocol.parse("   12.345 kg    NET")
        assertEquals(12.345, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses gross weight line`() {
        val result = protocol.parse("   0.1420 kg    G")
        assertEquals(0.1420, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses negative weight with sign next to the digit`() {
        val result = protocol.parse("   -1.250 kg")
        assertEquals(-1.250, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses weight without unit when unit content is off`() {
        val result = protocol.parse("    3.500")
        assertEquals(3.500, result!!.value, 0.0001)
        assertNull(result.unit)
    }

    @Test
    fun `returns null for non numeric lines`() {
        assertNull(protocol.parse("ERROR"))
        assertNull(protocol.parse(""))
    }
}

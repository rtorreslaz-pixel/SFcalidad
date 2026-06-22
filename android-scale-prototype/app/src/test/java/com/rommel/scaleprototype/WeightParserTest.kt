package com.rommel.scaleprototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WeightParserTest {

    @Test
    fun `parses simple weight with unit`() {
        val result = WeightParser.parse("    12.345 kg")
        assertEquals(12.345, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `parses negative weight`() {
        val result = WeightParser.parse("-0.020 kg")
        assertEquals(-0.020, result!!.value, 0.0001)
    }

    @Test
    fun `parses weight with explicit sign and no spacing`() {
        val result = WeightParser.parse("ST,+0.000,kg")
        assertEquals(0.000, result!!.value, 0.0001)
        assertEquals("kg", result.unit)
    }

    @Test
    fun `returns null when no number present`() {
        assertNull(WeightParser.parse("ERROR"))
    }

    @Test
    fun `parses weight without unit`() {
        val result = WeightParser.parse("   3.5")
        assertEquals(3.5, result!!.value, 0.0001)
        assertNull(result.unit)
    }
}

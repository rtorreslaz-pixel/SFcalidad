package com.rommel.scaleprototype.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Continuidad entre corrales: un galpón tiene 4 (A-D) y al terminar uno la pantalla debe proponer
 * el siguiente, para no reescribir los nueve campos del muestreo en cada corral.
 */
class ConfiguracionMuestreoTest {

    @Test
    fun `propone el siguiente corral del galpon`() {
        assertEquals("B", ConfiguracionMuestreoStore.siguienteCorral("A"))
        assertEquals("C", ConfiguracionMuestreoStore.siguienteCorral("B"))
        assertEquals("D", ConfiguracionMuestreoStore.siguienteCorral("C"))
    }

    @Test
    fun `despues del ultimo corral vuelve al primero`() {
        // Terminado el galpón normalmente se cambia de galpón; se propone A y el verificador
        // corrige el galpón, que es un campo editable como cualquier otro.
        assertEquals("A", ConfiguracionMuestreoStore.siguienteCorral("D"))
    }

    @Test
    fun `no adivina si el corral anterior no era uno de los cuatro`() {
        assertNull(ConfiguracionMuestreoStore.siguienteCorral("abcd"))
        assertNull(ConfiguracionMuestreoStore.siguienteCorral(""))
        assertNull(ConfiguracionMuestreoStore.siguienteCorral(null))
    }

    @Test
    fun `acepta el corral guardado en minuscula o con espacios`() {
        assertEquals("B", ConfiguracionMuestreoStore.siguienteCorral("a"))
        assertEquals("B", ConfiguracionMuestreoStore.siguienteCorral(" a "))
    }

    @Test
    fun `son cuatro corrales y el selector agrega la opcion libre`() {
        assertEquals(listOf("A", "B", "C", "D"), ConfiguracionMuestreoStore.CORRALES)
    }

    @Test
    fun `el dia se guarda en formato comparable`() {
        // Se compara como texto para decidir si la edad guardada sigue valiendo hoy.
        assertEquals(10, ConfiguracionMuestreoStore.hoy().length)
        assertEquals(2, ConfiguracionMuestreoStore.hoy().count { it == '-' })
    }
}

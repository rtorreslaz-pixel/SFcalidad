package com.rommel.scaleprototype.net

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DtoTest {

    private val json = Json { ignoreUnknownKeys = true }

    // Reproduce el payload real de GET /api/mobile/catalogos: Plantel.nombre es nullable
    // en el schema y hoy está en null para todos los registros existentes.
    @Test
    fun `decodifica plantel con nombre null`() {
        val payload = """{"planteles":[{"id":"cm1","codigo":"P006","nombre":null,"cliente":null}]}"""

        val response = json.decodeFromString(CatalogosResponse.serializer(), payload)

        assertEquals(1, response.planteles.size)
        assertEquals("P006", response.planteles[0].codigo)
        assertNull(response.planteles[0].nombre)
    }

    // GET /api/mobile/numero-ave-max devuelve maxNumeroAve: null cuando todavia no hay
    // ningun registro para esa combinacion plantel/campania/galpon/corral/categoria.
    @Test
    fun `decodifica numero ave max sin registros previos`() {
        val payload = """{"maxNumeroAve":null}"""

        val response = json.decodeFromString(NumeroAveMaxResponse.serializer(), payload)

        assertNull(response.maxNumeroAve)
    }
}

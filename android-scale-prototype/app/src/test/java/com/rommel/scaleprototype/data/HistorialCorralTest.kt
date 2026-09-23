package com.rommel.scaleprototype.data

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.Calendar
import java.util.TimeZone

/**
 * Historial de pesajes: un renglón por corral y día, con las aves reales y el promedio por ave.
 * Lo delicado aquí es que una pesada grupal es UN registro pero VARIAS aves, y que el día tiene
 * que cortarse en hora de Perú y no en UTC.
 */
@RunWith(RobolectricTestRunner::class)
class HistorialCorralTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: RegistroPesoDao

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = db.registroPesoDao()
    }

    @After
    fun tearDown() = db.close()

    /** "2026-09-16 09:00" en hora de Perú (UTC-5) como epoch millis. */
    private fun enLima(fechaHora: String): Long {
        val (f, h) = fechaHora.split(" ")
        val (anio, mes, dia) = f.split("-").map { it.toInt() }
        val (hora, min) = h.split(":").map { it.toInt() }
        val cal = Calendar.getInstance(TimeZone.getTimeZone("America/Lima"))
        cal.clear()
        cal.set(anio, mes - 1, dia, hora, min, 0)
        return cal.timeInMillis
    }

    private var n = 0

    private suspend fun pesar(
        fechaHora: String,
        galpon: String,
        corral: String,
        pesoGramos: Double,
        aves: Int = 1,
        synced: Boolean = true,
        tipoMuestreo: String = "PREVENTA",
    ) {
        n++
        dao.insert(
            RegistroPeso(
                id = "r$n",
                plantelId = "plantel-1",
                plantelCodigo = "P058",
                campania = "2603",
                galpon = galpon,
                corral = corral,
                categoria = "MACHO",
                numeroAve = n,
                pesoGramos = pesoGramos,
                tipoMuestreo = tipoMuestreo,
                fechaHoraEpochMillis = enLima(fechaHora),
                nAvesPorPesada = aves,
                synced = synced,
                createdAtEpochMillis = enLima(fechaHora),
            )
        )
    }

    @Test
    fun `una pesada grupal cuenta todas sus aves, no una sola`() = runBlocking {
        pesar("2026-09-16 09:00", galpon = "12", corral = "A", pesoGramos = 2600.0, aves = 3)

        val fila = dao.historialPorCorral().single()
        assertEquals(3, fila.aves)
        assertEquals(2600.0, fila.promedioGramos!!, 0.01)
    }

    /**
     * El caso que reportó el supervisor: se pesa de 3 en 3 y el corral cierra con 2 aves
     * sueltas. Esas 2 deben entrar con su propio peso y contar como 2 aves, ni más ni menos.
     */
    @Test
    fun `el corral que cierra con aves sueltas promedia bien`() = runBlocking {
        repeat(3) { pesar("2026-09-16 09:00", "12", "A", pesoGramos = 2600.0, aves = 3) }
        pesar("2026-09-16 09:10", "12", "A", pesoGramos = 2500.0, aves = 2)

        val fila = dao.historialPorCorral().single()
        assertEquals(11, fila.aves)
        // promedio ponderado por ave, no por pesada: (9 * 2600 + 2 * 2500) / 11
        assertEquals((9 * 2600.0 + 2 * 2500.0) / 11, fila.promedioGramos!!, 0.01)
    }

    @Test
    fun `los registros de solo calidad cuentan aves pero no entran al promedio`() = runBlocking {
        pesar("2026-09-16 09:00", "12", "C", pesoGramos = 2600.0)
        pesar("2026-09-16 09:05", "12", "C", pesoGramos = 0.0, tipoMuestreo = "CALIDAD")

        val fila = dao.historialPorCorral().single()
        assertEquals(2, fila.aves)
        assertEquals(1, fila.avesPesadas)
        assertEquals(2600.0, fila.promedioGramos!!, 0.01)
    }

    @Test
    fun `un corral de solo calidad no reporta promedio`() = runBlocking {
        pesar("2026-09-16 09:00", "12", "D", pesoGramos = 0.0, tipoMuestreo = "CALIDAD")

        assertNull(dao.historialPorCorral().single().promedioGramos)
    }

    /**
     * Una pesada de las 7 p.m. en Perú ya es del día siguiente en UTC. Si el corte se hiciera
     * en UTC, el verificador vería su muestreo de la tarde bajo la fecha equivocada.
     */
    @Test
    fun `el dia se corta en hora de Peru, no en UTC`() = runBlocking {
        pesar("2026-09-15 19:30", "14", "A", pesoGramos = 3000.0)

        assertEquals("2026-09-15", dao.historialPorCorral().single().dia)
    }

    @Test
    fun `separa corrales y dias, y ordena del mas reciente al mas antiguo`() = runBlocking {
        pesar("2026-09-14 09:00", "12", "A", pesoGramos = 2400.0)
        pesar("2026-09-16 09:00", "12", "A", pesoGramos = 2600.0)
        pesar("2026-09-16 09:00", "12", "B", pesoGramos = 2500.0)

        val filas = dao.historialPorCorral()
        assertEquals(3, filas.size)
        assertEquals(listOf("2026-09-16", "2026-09-16", "2026-09-14"), filas.map { it.dia })
        assertEquals(listOf("A", "B", "A"), filas.map { it.corral })
    }

    @Test
    fun `los muestreos ya sincronizados siguen en el historial`() = runBlocking {
        pesar("2026-09-16 09:00", "12", "A", pesoGramos = 2600.0, synced = true)
        pesar("2026-09-16 09:01", "12", "A", pesoGramos = 2600.0, synced = false)

        val fila = dao.historialPorCorral().single()
        assertEquals(2, fila.aves)
        assertEquals(1, fila.pendientes)
        assertTrue("el sincronizado no debe desaparecer", fila.aves > fila.pendientes)
    }
}

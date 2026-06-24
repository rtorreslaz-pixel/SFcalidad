package com.rommel.scaleprototype.data

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RegistroPesoDaoTest {

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
    fun tearDown() {
        db.close()
    }

    private fun registro(
        id: String,
        plantelId: String = "plantel-1",
        galpon: String = "1",
        corral: String = "A",
        categoria: String = "MACHO",
        numeroAve: Int,
        synced: Boolean = false,
    ) = RegistroPeso(
        id = id,
        plantelId = plantelId,
        plantelCodigo = "P006",
        galpon = galpon,
        corral = corral,
        categoria = categoria,
        numeroAve = numeroAve,
        pesoGramos = 2000.0,
        fechaHoraEpochMillis = 0L,
        synced = synced,
        createdAtEpochMillis = numeroAve.toLong(),
    )

    @Test
    fun `getMaxNumeroAve returns null when no registros exist for the combination`() = runBlocking {
        val max = dao.getMaxNumeroAve("plantel-1", "1", "A", "MACHO")
        assertNull(max)
    }

    @Test
    fun `getMaxNumeroAve returns the highest numeroAve scoped to plantel galpon corral and categoria`() = runBlocking {
        dao.insert(registro(id = "a", numeroAve = 1))
        dao.insert(registro(id = "b", numeroAve = 5))
        dao.insert(registro(id = "c", numeroAve = 3))
        dao.insert(registro(id = "d", corral = "B", numeroAve = 99))

        val max = dao.getMaxNumeroAve("plantel-1", "1", "A", "MACHO")
        assertEquals(5, max)
    }

    @Test
    fun `getUnsyncedBatch only returns unsynced rows ordered by creation time, limited`() = runBlocking {
        dao.insert(registro(id = "a", numeroAve = 1, synced = true))
        dao.insert(registro(id = "b", numeroAve = 2, synced = false))
        dao.insert(registro(id = "c", numeroAve = 3, synced = false))

        val batch = dao.getUnsyncedBatch(limit = 1)
        assertEquals(1, batch.size)
        assertEquals("b", batch.first().id)
    }

    @Test
    fun `markSynced flips synced flag and excludes rows from future unsynced batches`() = runBlocking {
        dao.insert(registro(id = "a", numeroAve = 1))
        dao.insert(registro(id = "b", numeroAve = 2))

        dao.markSynced(listOf("a"))

        val remaining = dao.getUnsyncedBatch(limit = 10)
        assertEquals(1, remaining.size)
        assertEquals("b", remaining.first().id)
    }
}

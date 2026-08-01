package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SacaDao {

    @Insert
    suspend fun insertMuestreo(muestreo: SacaMuestreo)

    @Insert
    suspend fun insertPesada(pesada: SacaPesada)

    @Query("SELECT * FROM saca_muestreo WHERE id = :id")
    suspend fun getMuestreo(id: String): SacaMuestreo?

    @Query("SELECT * FROM saca_pesada WHERE muestreoId = :muestreoId ORDER BY fechaHoraEpochMillis ASC")
    suspend fun getPesadas(muestreoId: String): List<SacaPesada>

    @Query("SELECT * FROM saca_pesada WHERE muestreoId = :muestreoId ORDER BY fechaHoraEpochMillis ASC")
    fun getPesadasFlow(muestreoId: String): Flow<List<SacaPesada>>

    // Cola de sincronización: los muestreos que aún no llegaron al servidor.
    @Query("SELECT * FROM saca_muestreo WHERE synced = 0 ORDER BY createdAtEpochMillis ASC LIMIT :limit")
    suspend fun getUnsyncedMuestreos(limit: Int = 20): List<SacaMuestreo>

    @Query("UPDATE saca_muestreo SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<String>)

    @Query("SELECT COUNT(*) FROM saca_muestreo WHERE synced = 0")
    fun countUnsyncedFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM saca_muestreo WHERE synced = 0")
    suspend fun countUnsynced(): Int
}

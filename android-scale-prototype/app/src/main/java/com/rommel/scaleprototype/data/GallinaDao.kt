package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface GallinaDao {

    @Insert
    suspend fun insertDespacho(despacho: GallinaDespacho)

    @Insert
    suspend fun insertPesada(pesada: GallinaPesada)

    @Query("SELECT * FROM gallina_despacho WHERE id = :id")
    suspend fun getDespacho(id: String): GallinaDespacho?

    @Query("SELECT * FROM gallina_pesada WHERE despachoId = :despachoId ORDER BY fechaHoraEpochMillis ASC")
    suspend fun getPesadas(despachoId: String): List<GallinaPesada>

    // Cola de sincronización: los despachos que aún no llegaron al servidor.
    @Query("SELECT * FROM gallina_despacho WHERE synced = 0 ORDER BY createdAtEpochMillis ASC LIMIT :limit")
    suspend fun getUnsyncedDespachos(limit: Int = 20): List<GallinaDespacho>

    @Query("UPDATE gallina_despacho SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<String>)

    @Query("SELECT COUNT(*) FROM gallina_despacho WHERE synced = 0")
    fun countUnsyncedFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM gallina_despacho WHERE synced = 0")
    suspend fun countUnsynced(): Int
}

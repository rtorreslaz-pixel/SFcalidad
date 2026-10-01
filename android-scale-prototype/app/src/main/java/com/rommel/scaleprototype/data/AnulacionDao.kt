package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
interface AnulacionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun encolar(anulacion: AnulacionPendiente)

    @Query("UPDATE registro_peso SET anuladoEnEpochMillis = :cuando WHERE id = :id")
    suspend fun marcarPreventa(id: String, cuando: Long)

    @Query("UPDATE saca_pesada SET anuladoEnEpochMillis = :cuando WHERE id = :id")
    suspend fun marcarSaca(id: String, cuando: Long)

    @Query("UPDATE gallina_pesada SET anuladoEnEpochMillis = :cuando WHERE id = :id")
    suspend fun marcarGallina(id: String, cuando: Long)

    /** Marca el registro y encola su anulación en una sola operación. */
    @Transaction
    suspend fun anular(id: String, tipo: String, cuando: Long = System.currentTimeMillis()) {
        when (tipo) {
            AnulacionPendiente.TIPO_PREVENTA -> marcarPreventa(id, cuando)
            AnulacionPendiente.TIPO_SACA -> marcarSaca(id, cuando)
            else -> marcarGallina(id, cuando)
        }
        encolar(AnulacionPendiente(registroId = id, tipo = tipo, anuladoEnEpochMillis = cuando))
    }

    @Query("SELECT * FROM anulacion_pendiente WHERE synced = 0 AND tipo = :tipo LIMIT :limit")
    suspend fun pendientesPorTipo(tipo: String, limit: Int = 100): List<AnulacionPendiente>

    @Query("UPDATE anulacion_pendiente SET synced = 1 WHERE registroId IN (:ids)")
    suspend fun markSynced(ids: List<String>)

    @Query("SELECT COUNT(*) FROM anulacion_pendiente WHERE synced = 0")
    suspend fun countUnsynced(): Int
}

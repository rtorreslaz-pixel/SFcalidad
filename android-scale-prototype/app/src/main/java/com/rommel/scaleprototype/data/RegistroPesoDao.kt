package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface RegistroPesoDao {

    @Insert
    suspend fun insert(registro: RegistroPeso)

    @Query("SELECT * FROM registro_peso WHERE synced = 0 ORDER BY createdAtEpochMillis ASC LIMIT :limit")
    suspend fun getUnsyncedBatch(limit: Int = 50): List<RegistroPeso>

    @Query("UPDATE registro_peso SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<String>)

    @Query("SELECT COUNT(*) FROM registro_peso WHERE synced = 0")
    fun countUnsyncedFlow(): Flow<Int>

    // El "siguiente número de ave" siempre se calcula desde lo persistido (nunca un
    // contador en memoria), para que un crash a mitad de corral no duplique números.
    // Escopado también por campania: el mismo corral físico se reutiliza entre campañas,
    // y cada campaña debe re-empezar su conteo de aves.
    @Query(
        "SELECT MAX(numeroAve) FROM registro_peso " +
            "WHERE plantelId = :plantelId AND campania = :campania AND galpon = :galpon " +
            "AND corral = :corral AND categoria = :categoria"
    )
    suspend fun getMaxNumeroAve(
        plantelId: String,
        campania: String,
        galpon: String,
        corral: String,
        categoria: String,
    ): Int?
}

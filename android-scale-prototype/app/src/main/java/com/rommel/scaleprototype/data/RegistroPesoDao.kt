package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/** Resumen de un muestreo (lote) del día: cuántas aves y cuántas quedan por sincronizar. */
data class MuestreoDiaResumen(
    val plantelCodigo: String,
    val campania: String,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val total: Int,
    val pendientes: Int,
)

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

    @Query("SELECT COUNT(*) FROM registro_peso WHERE synced = 0")
    suspend fun countUnsynced(): Int

    @Query("SELECT MIN(createdAtEpochMillis) FROM registro_peso WHERE synced = 0")
    suspend fun oldestUnsyncedEpochMillis(): Long?

    // Muestreos del día agrupados por lote (plantel-campaña-galpón-corral-categoría), con el
    // total de aves y cuántas quedan sin sincronizar. Sirve para que el verificador controle
    // qué muestreos están completos y cuáles le faltan enviar.
    @Query(
        "SELECT plantelCodigo, campania, galpon, corral, categoria, " +
            "COUNT(*) AS total, " +
            "SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) AS pendientes " +
            "FROM registro_peso WHERE createdAtEpochMillis >= :desdeEpochMillis " +
            "GROUP BY plantelCodigo, campania, galpon, corral, categoria " +
            "ORDER BY MAX(createdAtEpochMillis) DESC"
    )
    suspend fun muestreosDelDia(desdeEpochMillis: Long): List<MuestreoDiaResumen>

    // Pendientes creados por OTRO usuario (los NULL son de versiones viejas de la app:
    // dueño desconocido, no cuentan). Ver advertencia de atribución en LoginFragment.
    @Query(
        "SELECT COUNT(*) FROM registro_peso " +
            "WHERE synced = 0 AND verificadorId IS NOT NULL AND verificadorId != :verificadorId"
    )
    suspend fun countUnsyncedFromOtherUser(verificadorId: String): Int

    @Query(
        "SELECT verificadorNombre FROM registro_peso " +
            "WHERE synced = 0 AND verificadorId IS NOT NULL AND verificadorId != :verificadorId " +
            "ORDER BY createdAtEpochMillis DESC LIMIT 1"
    )
    suspend fun latestOtherUserNombre(verificadorId: String): String?

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

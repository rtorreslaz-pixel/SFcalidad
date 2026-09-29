package com.rommel.scaleprototype.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/** Una fila del historial de gallina: un despacho con sus totales. */
data class HistorialDespacho(
    val id: String,
    val dia: String,
    val clienteNombre: String,
    val materialCodigo: String,
    val guiaReferencia: String,
    val placa: String,
    val synced: Boolean,
    val pesadas: Int,
    val jabas: Int,
    val unidades: Int,
    val netoGramos: Double,
) {
    /** Gramos por ave del despacho completo, o null si todavía no tiene pesadas. */
    val promedioGramos: Double? get() = if (unidades > 0) netoGramos / unidades else null
}

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

    // Historial: un renglón por despacho, con sus totales ya sumados. El día se corta en
    // hora de Perú (−5) y no en UTC, para que un despacho de la tarde no salte al día
    // siguiente. El promedio es ponderado por ave del despacho completo: se divide el neto
    // total entre las unidades totales, no se promedian los promedios de cada tanda.
    @Query(
        "SELECT d.id AS id, " +
            "date((d.fechaEpochMillis / 1000) - 18000, 'unixepoch') AS dia, " +
            "d.clienteNombre AS clienteNombre, d.materialCodigo AS materialCodigo, " +
            "d.guiaReferencia AS guiaReferencia, d.placa AS placa, d.synced AS synced, " +
            "COUNT(p.id) AS pesadas, " +
            "COALESCE(SUM(p.jabas), 0) AS jabas, " +
            "COALESCE(SUM(p.unidades), 0) AS unidades, " +
            "COALESCE(SUM(p.pesoNetoGramos), 0) AS netoGramos " +
            "FROM gallina_despacho d LEFT JOIN gallina_pesada p ON p.despachoId = d.id " +
            "GROUP BY d.id ORDER BY d.fechaEpochMillis DESC"
    )
    suspend fun historialDespachos(): List<HistorialDespacho>
}

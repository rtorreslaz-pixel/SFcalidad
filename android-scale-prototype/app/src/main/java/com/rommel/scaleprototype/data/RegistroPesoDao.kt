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

/**
 * Una fila del historial: un corral muestreado un día. [aves] suma las aves de verdad
 * (una pesada grupal de 3 cuenta 3) y [pesoTotal] suma el peso de todas ellas, para poder
 * promediar por ave sin que una pesada grupal pese lo mismo que una individual.
 * Los registros de solo calidad (peso 0) quedan fuera del promedio.
 */
data class HistorialCorral(
    val dia: String,
    val plantelCodigo: String,
    val campania: String,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val aves: Int,
    val avesPesadas: Int,
    val pesoTotal: Double,
    val pendientes: Int,
) {
    /** Gramos por ave, o null si en ese corral solo se levantó calidad (sin peso). */
    val promedioGramos: Double? get() = if (avesPesadas > 0) pesoTotal / avesPesadas else null
}

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

    // Historial completo del teléfono, un renglón por corral y día. Los registros no se
    // borran al sincronizar, así que esto cubre también los muestreos ya enviados.
    //
    // El día se calcula restando 5 horas (hora de Perú) antes de recortar la fecha, para que
    // un muestreo de las 7 p.m. no aparezca al día siguiente como pasaría en UTC.
    //
    // Una pesada grupal de 3 aves es UN registro pero TRES aves, y su pesoGramos ya es el
    // promedio por ave: por eso las aves se suman por nAvesPorPesada y el peso se multiplica
    // por ese mismo número. Sin eso, una pesada de 3 pesaría igual que una individual en el
    // promedio. Los registros de solo calidad (pesoGramos = 0) cuentan como aves pero quedan
    // fuera del promedio.
    @Query(
        "SELECT date((fechaHoraEpochMillis / 1000) - 18000, 'unixepoch') AS dia, " +
            "plantelCodigo, campania, galpon, corral, categoria, " +
            "SUM(CASE WHEN nAvesPorPesada > 1 THEN nAvesPorPesada ELSE 1 END) AS aves, " +
            "SUM(CASE WHEN pesoGramos > 0 THEN (CASE WHEN nAvesPorPesada > 1 THEN nAvesPorPesada ELSE 1 END) ELSE 0 END) AS avesPesadas, " +
            "SUM(CASE WHEN pesoGramos > 0 THEN pesoGramos * (CASE WHEN nAvesPorPesada > 1 THEN nAvesPorPesada ELSE 1 END) ELSE 0 END) AS pesoTotal, " +
            "SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) AS pendientes " +
            "FROM registro_peso " +
            "GROUP BY dia, plantelCodigo, campania, galpon, corral, categoria " +
            "ORDER BY dia DESC, plantelCodigo, campania, galpon, corral, categoria"
    )
    suspend fun historialPorCorral(): List<HistorialCorral>

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

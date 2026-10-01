package com.rommel.scaleprototype.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Cola de anulaciones por enviar.
 *
 * Anular es independiente de si el registro ya subió: puede anularse algo que todavía está
 * en la cola de sincronización o algo que el servidor ya tiene. Por eso la anulación viaja
 * como su propio pendiente, y el SyncWorker la manda DESPUÉS de los registros, para que el
 * servidor nunca reciba la anulación de algo que aún no conoce.
 */
@Entity(tableName = "anulacion_pendiente")
data class AnulacionPendiente(
    /** Id del registro anulado: el mismo que tiene en el servidor. */
    @PrimaryKey val registroId: String,
    /** PREVENTA, SACA o GALLINA. */
    val tipo: String,
    val anuladoEnEpochMillis: Long,
    val synced: Boolean = false,
) {
    companion object {
        const val TIPO_PREVENTA = "PREVENTA"
        const val TIPO_SACA = "SACA"
        const val TIPO_GALLINA = "GALLINA"
    }
}

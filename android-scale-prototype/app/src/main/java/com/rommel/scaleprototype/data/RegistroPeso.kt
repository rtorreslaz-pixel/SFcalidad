package com.rommel.scaleprototype.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "registro_peso")
data class RegistroPeso(
    @PrimaryKey val id: String,
    val plantelId: String,
    val plantelCodigo: String,
    val campania: String,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val numeroAve: Int,
    val pesoGramos: Double,
    val fechaHoraEpochMillis: Long,
    // Calidad evaluada opcionalmente sobre esta misma ave (null = no evaluada en esta ave).
    val tieneHematoma: Boolean? = null,
    val tieneDefectoSeleccion: Boolean? = null,
    val gradoPododermatitis: Int? = null,
    val gradoRasguno: Int? = null,
    val pigmentacion: Int? = null,
    val synced: Boolean = false,
    val createdAtEpochMillis: Long,
)

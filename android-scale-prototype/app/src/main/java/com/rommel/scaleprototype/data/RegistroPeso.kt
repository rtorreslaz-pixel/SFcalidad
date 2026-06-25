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
    val synced: Boolean = false,
    val createdAtEpochMillis: Long,
)

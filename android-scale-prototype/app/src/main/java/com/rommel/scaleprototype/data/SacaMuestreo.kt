package com.rommel.scaleprototype.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Muestreo de saca (~40+ días): el equipo de saca pesa ALGUNAS jabas antes de la saca diaria,
 * no el galpón completo. De ahí sale el peso promedio por ave para compararlo con la preventa
 * (~35 días) del mismo lote.
 *
 * Se guarda primero en el teléfono y se sincroniza después, igual que los pesos de preventa:
 * en granja no siempre hay señal. El id es un UUID generado aquí para que un reintento de red
 * no duplique el muestreo en el servidor.
 */
@Entity(tableName = "saca_muestreo")
data class SacaMuestreo(
    @PrimaryKey val id: String,
    val plantelId: String,
    val plantelCodigo: String,
    val campania: String,
    val galpon: String,
    val categoria: String,
    val edad: Int?,
    /** Aves por jaba y tara: se establecen una vez y valen para todas las pesadas. */
    val avesPorJaba: Int,
    val taraGramosPorJaba: Double,
    val tipoJaba: String?,
    val fechaEpochMillis: Long,
    val verificadorId: String?,
    val verificadorNombre: String?,
    val synced: Boolean = false,
    val createdAtEpochMillis: Long,
)

/**
 * Una pesada = varias jabas puestas juntas en la balanza. El neto descuenta la tara de esas
 * jabas y el promedio por ave sale de dividir el neto entre las aves que contienen.
 */
@Entity(tableName = "saca_pesada")
data class SacaPesada(
    @PrimaryKey val id: String,
    val muestreoId: String,
    val numJabas: Int,
    val pesoBrutoGramos: Double,
    val pesoNetoGramos: Double,
    val avesTotal: Int,
    val promedioGramos: Double,
    val fechaHoraEpochMillis: Long,
)

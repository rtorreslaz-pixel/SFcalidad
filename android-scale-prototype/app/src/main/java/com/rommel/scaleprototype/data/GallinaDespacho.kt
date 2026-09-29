package com.rommel.scaleprototype.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Módulo GALLINA: pesaje de gallina de descarte en el despacho al cliente.
 *
 * A diferencia de preventa y saca, que muestrean un lote en granja, aquí la unidad es el
 * camión: un cliente, una guía de referencia y una placa. No hay plantel ni galpón.
 *
 * Se guarda primero en el teléfono y se sincroniza después, igual que el resto: en el local
 * del cliente tampoco siempre hay señal. El id es un UUID generado aquí para que un reintento
 * de red no duplique el despacho en el servidor.
 */
@Entity(tableName = "gallina_despacho")
data class GallinaDespacho(
    @PrimaryKey val id: String,
    val clienteId: String,
    val clienteNombre: String,
    val materialId: String,
    val materialCodigo: String,
    val materialDescripcion: String,
    val guiaReferencia: String,
    val placa: String,
    /** Aves por jaba. Vale para todas las pesadas: las unidades salen de multiplicarla. */
    val densidad: Int,
    val fechaEpochMillis: Long,
    val verificadorId: String?,
    val verificadorNombre: String?,
    val synced: Boolean = false,
    val createdAtEpochMillis: Long,
)

/**
 * Una pesada = una tanda de jabas, pesada DOS veces: vacía (destare) y con las gallinas
 * dentro. El neto es la resta, porque las jabas de gallina no tienen una tara fija confiable.
 *
 * El neto, las unidades y el promedio se guardan calculados para poder mostrarlos sin
 * conexión, pero el servidor los vuelve a calcular al recibirlos: manda su cuenta, no la del
 * teléfono, para que una app vieja no meta números distintos a los del reporte.
 */
@Entity(tableName = "gallina_pesada")
data class GallinaPesada(
    @PrimaryKey val id: String,
    val despachoId: String,
    val jabas: Int,
    val pesoDestareGramos: Double,
    val pesoConAveGramos: Double,
    val pesoNetoGramos: Double,
    val unidades: Int,
    val promedioGramos: Double,
    val fechaHoraEpochMillis: Long,
)

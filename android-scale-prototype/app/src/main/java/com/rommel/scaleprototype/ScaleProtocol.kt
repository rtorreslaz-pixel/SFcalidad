package com.rommel.scaleprototype

/**
 * Peso decodificado de una línea de la báscula.
 * @param stable `true` si la báscula reporta la lectura como estabilizada. Las básculas que no
 *   distinguen estabilidad devuelven `true` por defecto (contrato histórico); las que sí lo
 *   informan (p. ej. BIT PS 4.0, prefijo `S`/`U`) lo propagan para poder capturar solo pesos firmes.
 */
data class ParsedWeight(val value: Double, val unit: String?, val stable: Boolean = true)

/**
 * Decodifica el peso a partir de una línea cruda enviada por una báscula. Cada marca/
 * protocolo (Ohaus, MT-SICS de Mettler Toledo, etc.) tiene su propio formato de texto,
 * pero todas llegan por el mismo socket Bluetooth SPP (ver [ScaleBluetoothClient]). Para
 * soportar una báscula nueva con un formato distinto basta con agregar una clase que
 * implemente esta interfaz y registrarla en [ScaleProtocols] — no hace falta tocar la
 * conexión Bluetooth ni la UI.
 */
interface ScaleProtocol {
    val id: String
    val displayName: String
    fun parse(line: String): ParsedWeight?
}

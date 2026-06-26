package com.rommel.scaleprototype

/**
 * Decodifica la salida continua RS-232 de los indicadores T-Scale serie BW/BWS/CW/VW (trama
 * "Con2" del manual técnico oficial, sección "RS-232 Communication Protocol"): 02H (STX) +
 * Header1 (posición del punto decimal) + Header2 (flags de estado) + Header3 (unidad) + 6
 * dígitos de peso + 6 dígitos de tara + CR LF. El kit Bluetooth SPP solo reemplaza el cable
 * RS-232, igual que con la Ohaus — y como la trama termina en CR LF, encaja sin cambios en el
 * lector de líneas de [ScaleBluetoothClient] aunque el resto de los bytes sea binario.
 *
 *   [0] Header0 = 02H (STX, fijo)
 *   [1] Header1 = 22H..26H -> 0 a 4 decimales
 *   [2] Header2 = 20H base + flags: neto +01H, negativo +02H, overload +04H, inestable +08H, kg +10H
 *   [3] Header3 = unidad: 21H=g, 23H=oz (si no calza, se usa el flag kg de Header2)
 *   [4..9]  Weight1..6 = dígitos del peso (los 6 más significativos primero)
 *   [10..15] Tare1..6  = dígitos de tara (no se usan: si el flag "neto" está activo el peso ya viene neto)
 *
 * El único manual público disponible para este modelo es un PDF escaneado y no confirma si los
 * dígitos de peso/tara van como caracteres ASCII ('0'-'9', 30H-39H) o como nibbles binarios
 * (00H-09H), así que [decodeDigit] acepta ambas variantes. El peso se devuelve siempre en kg
 * (igual que las otras balanzas soportadas) sin importar la unidad de la trama original —
 * `CaptureFragment` asume ese contrato para todos los `ScaleProtocol`.
 *
 * IMPORTANTE: antes de usar esta báscula en campo, validar con la pantalla "Diagnóstico
 * Bluetooth" (casilla "hex") que los bytes crudos coinciden con esta tabla; si el firmware real
 * difiere, avisar para ajustar el parser con una captura real en vez de adivinar.
 */
class TScaleBwProtocol : ScaleProtocol {
    override val id: String = "tscale-bw"
    override val displayName: String = "T-Scale BW / BWS / CW / VW (salida continua RS-232)"

    override fun parse(line: String): ParsedWeight? {
        if (line.length < WEIGHT_FIELD_START + WEIGHT_FIELD_LENGTH) return null
        if (line[0].code != STX) return null

        val decimales = DECIMAL_POINT_BY_HEADER1[line[1].code] ?: return null

        val header2 = line[2].code
        if (header2 and STATUS_MASK != STATUS_BASE) return null
        if (header2 and FLAG_OVERLOAD != 0) return null
        val esNegativo = header2 and FLAG_NEGATIVE != 0
        val esKg = header2 and FLAG_KG != 0

        val header3 = line.getOrNull(3)?.code
        val unidadOriginal = when {
            header3 == UNIT_ONZAS -> Unidad.OZ
            esKg -> Unidad.KG
            else -> Unidad.GRAMOS
        }

        val digitos = (WEIGHT_FIELD_START until WEIGHT_FIELD_START + WEIGHT_FIELD_LENGTH).map {
            decodeDigit(line[it].code) ?: return null
        }
        val magnitud = digitos.fold(0L) { acc, d -> acc * 10 + d }
        val valorEnUnidadOriginal = magnitud / Math.pow(10.0, decimales.toDouble())

        val valorKg = when (unidadOriginal) {
            Unidad.KG -> valorEnUnidadOriginal
            Unidad.GRAMOS -> valorEnUnidadOriginal / 1000.0
            Unidad.OZ -> valorEnUnidadOriginal * KG_POR_ONZA
        }

        return ParsedWeight(if (esNegativo) -valorKg else valorKg, "kg")
    }

    private fun decodeDigit(byteValue: Int): Int? = when {
        byteValue in ASCII_DIGIT_ZERO..ASCII_DIGIT_NINE -> byteValue - ASCII_DIGIT_ZERO
        byteValue in 0..9 -> byteValue
        byteValue == ASCII_SPACE -> 0
        else -> null
    }

    private enum class Unidad { KG, GRAMOS, OZ }

    companion object {
        private const val STX = 0x02
        private const val WEIGHT_FIELD_START = 4
        private const val WEIGHT_FIELD_LENGTH = 6

        private const val ASCII_DIGIT_ZERO = 0x30
        private const val ASCII_DIGIT_NINE = 0x39
        private const val ASCII_SPACE = 0x20

        private const val STATUS_BASE = 0x20
        private const val STATUS_MASK = 0xE0
        private const val FLAG_NEGATIVE = 0x02
        private const val FLAG_OVERLOAD = 0x04
        private const val FLAG_KG = 0x10

        private const val UNIT_ONZAS = 0x23

        private const val KG_POR_ONZA = 0.0283495231

        private val DECIMAL_POINT_BY_HEADER1 = mapOf(
            0x22 to 0,
            0x23 to 1,
            0x24 to 2,
            0x25 to 3,
            0x26 to 4,
        )
    }
}

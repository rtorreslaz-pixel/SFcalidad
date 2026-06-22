package com.rommel.scaleprototype

data class ParsedWeight(val value: Double, val unit: String?)

/**
 * Extrae el primer número (con signo opcional) y la unidad que le siga en una línea
 * de texto recibida de la balanza. Es heurístico porque aún no conocemos el formato
 * exacto que usa la Ranger R31P30 en modo continuo por Bluetooth: una vez capturado
 * el formato real, esta expresión regular se puede ajustar para que sea exacta.
 */
object WeightParser {
    private val WEIGHT_REGEX = Regex(
        """([+-]?\d+(?:\.\d+)?)[\s,]*(kg|g|lb|oz)?""",
        RegexOption.IGNORE_CASE
    )

    fun parse(line: String): ParsedWeight? {
        val match = WEIGHT_REGEX.find(line) ?: return null
        val value = match.groupValues[1].toDoubleOrNull() ?: return null
        val unit = match.groupValues[2].takeIf { it.isNotBlank() }?.lowercase()
        return ParsedWeight(value, unit)
    }
}

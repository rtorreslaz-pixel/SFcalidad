package com.rommel.scaleprototype

/**
 * Formato real de salida RS232/continua de la Ohaus Ranger 3000 (incluye R31P30), según el
 * manual oficial (sección 7.5 "Output Format"): cada línea trae, separados por un espacio,
 * el peso (9 car. máx., justificado a la derecha, signo pegado al dígito), la unidad (5 car.
 * máx., justificada a la izquierda), opcionalmente "?" si el peso no está estable, y
 * opcionalmente "NET" o "G" si la línea es de peso neto/bruto. El kit Bluetooth solo
 * reemplaza el cable RS232 — la trama es idéntica.
 */
class OhausRangerProtocol : ScaleProtocol {
    override val id: String = "ohaus-ranger-3000"
    override val displayName: String = "Ohaus Ranger 3000 / R31P30 (formato oficial RS232)"

    override fun parse(line: String): ParsedWeight? {
        val tokens = line.trim().split(WHITESPACE_REGEX)
        val weightToken = tokens.firstOrNull() ?: return null
        if (!WEIGHT_FIELD_REGEX.matches(weightToken)) return null
        val value = weightToken.toDoubleOrNull() ?: return null
        val unit = tokens.drop(1).firstOrNull { UNIT_REGEX.matches(it) }
        return ParsedWeight(value, unit?.lowercase())
    }

    companion object {
        private val WHITESPACE_REGEX = Regex("\\s+")
        private val WEIGHT_FIELD_REGEX = Regex("""[+-]?\d+(?:\.\d+)?""")
        private val UNIT_REGEX = Regex("(?i)^(kg|g|lb|oz|lb:oz)$")
    }
}

package com.rommel.scaleprototype

/**
 * Heurística genérica: toma el primer número con signo de la línea y la unidad que le
 * siga (si la reconoce). Sirve como protocolo "por defecto" mientras no se conoce el
 * formato exacto de una báscula nueva, y como base de comparación cuando se agregue un
 * protocolo específico (p. ej. MT-SICS de Mettler Toledo) más adelante.
 */
class GenericRegexProtocol : ScaleProtocol {
    override val id: String = "generic-regex"
    override val displayName: String = "Genérico (cualquier marca, heurístico)"

    override fun parse(line: String): ParsedWeight? {
        val match = WEIGHT_REGEX.find(line) ?: return null
        val value = match.groupValues[1].toDoubleOrNull() ?: return null
        val unit = match.groupValues[2].takeIf { it.isNotBlank() }?.lowercase()
        return ParsedWeight(value, unit)
    }

    companion object {
        private val WEIGHT_REGEX = Regex(
            """([+-]?\d+(?:\.\d+)?)[\s,]*(kg|g|lb|oz)?""",
            RegexOption.IGNORE_CASE
        )
    }
}

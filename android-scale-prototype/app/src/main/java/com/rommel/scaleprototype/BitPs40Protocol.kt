package com.rommel.scaleprototype

import kotlin.math.abs

/**
 * Bröring BIT PS 4.0 IoT (báscula avícola).
 *
 * Formato REAL de la trama Bluetooth SPP, confirmado con captura de la báscula física
 * (pantalla "Diagnóstico Bluetooth", casilla hex — dispositivo `scale-2413-0214`):
 *
 *     <estado><peso><CR/LF>
 *
 * donde `<estado>` es una letra:
 *   - `U` (0x55) = peso **inestable** (en movimiento / aún no estabilizado),
 *   - `S` (0x53) = peso **estable** (lectura firme),
 * y `<peso>` es un entero. Ejemplos capturados (subida de peso hasta estabilizar y bajar):
 *     U5, U10, U45, U225, U520, U755, U1085, U1280, U1375, U1440, S1460, U105, U0, U0 …
 * El [ScaleBluetoothClient] separa por `\r`/`\n`, así que cada trama llega como una "línea"
 * ya sin el terminador.
 *
 * UNIDAD: el entero viene en **gramos** (1460 -> 1.460 kg, rango típico de un ave). Este es
 * el valor por defecto y coincide con el rango avícola; si al comparar contra el display la
 * báscula estuviera configurada en otra resolución, ajustar [DIVISOR_A_KG].
 *
 * Si la trama no coincide con `<U|S><entero>` (otra config/firmware), cae a una heurística de
 * texto tolerante (coma decimal alemana, unidad kg/g explícita, descarta horas/fechas/series).
 *
 * Devuelve SIEMPRE kg — [com.rommel.scaleprototype.ui.CaptureFragment] asume ese contrato para
 * todos los `ScaleProtocol`. Propaga además `stable` (S = true, U = false) para poder capturar
 * solo lecturas estabilizadas.
 */
class BitPs40Protocol : ScaleProtocol {
    override val id: String = "bitps-40-iot"
    override val displayName: String = "BIT PS 4.0 IoT (Bröring)"

    override fun parse(line: String): ParsedWeight? {
        parseTramaEstado(line)?.let { return it }
        return parseHeuristico(line)
    }

    /**
     * Trama nativa `<U|S><entero>` (formato real de la báscula). Devuelve null si la línea no
     * tiene esa forma, para que [parse] pruebe la heurística de respaldo.
     */
    private fun parseTramaEstado(line: String): ParsedWeight? {
        val m = TRAMA_ESTADO_REGEX.find(sanitize(line).trim()) ?: return null
        val estable = m.groupValues[1].uppercase() == "S"
        val gramos = m.groupValues[2].replace(',', '.').toDoubleOrNull() ?: return null
        val kg = gramos / DIVISOR_A_KG
        if (abs(kg) > MAX_KG_AVICOLA) return null
        return ParsedWeight(kg, "kg", stable = estable)
    }

    private fun parseHeuristico(line: String): ParsedWeight? {
        val text = sanitize(line)
        val candidatos = NUMBER_REGEX.findAll(text).filter { esCandidatoAislado(text, it) }.toList()
        val elegido = candidatos.firstOrNull { unidadExplicita(text, it) != null }
            ?: candidatos.firstOrNull()
            ?: return null

        val token = elegido.groupValues[1]
        val crudo = token.replace(',', '.').toDoubleOrNull() ?: return null
        val tieneDecimales = token.contains('.') || token.contains(',')

        val kg = when (unidadExplicita(text, elegido)) {
            "kg" -> crudo
            "g" -> crudo / 1000.0
            else -> if (!tieneDecimales && abs(crudo) >= UMBRAL_ENTERO_GRAMOS) crudo / 1000.0 else crudo
        }
        if (abs(kg) > MAX_KG_AVICOLA) return null
        return ParsedWeight(kg, "kg")
    }

    /** Bytes de control (STX, CR, etc.) se tratan como separadores, no como parte del texto. */
    private fun sanitize(line: String): String =
        line.map { if (it.code < 0x20) ' ' else it }.joinToString("")

    /**
     * Un número "aislado" no viene pegado a letras ni a separadores de fecha/hora/serie.
     * Rechaza "SCALE-2023" (pegado a '-'), "12:34" (hora), "01/02" (fecha) y "1.2.3" (versión).
     */
    private fun esCandidatoAislado(text: String, match: MatchResult): Boolean {
        val antes = text.getOrNull(match.range.first - 1)
        if (antes != null && (antes.isLetterOrDigit() || antes in PEGADO_ANTES)) return false
        val despues = text.getOrNull(match.range.last + 1)
        val despues2 = text.getOrNull(match.range.last + 2)
        if (despues != null && despues in PEGADO_DESPUES && despues2?.isDigit() == true) return false
        return true
    }

    /** Devuelve "kg" o "g" si el número viene seguido (con espacios opcionales) de esa unidad. */
    private fun unidadExplicita(text: String, match: MatchResult): String? {
        var i = match.range.last + 1
        while (i < text.length && text[i] == ' ') i++
        val resto = text.substring(i)
        return when {
            resto.regionMatches(0, "kg", 0, 2, ignoreCase = true) && !esLetraODigito(resto.getOrNull(2)) -> "kg"
            resto.regionMatches(0, "g", 0, 1, ignoreCase = true) && !esLetraODigito(resto.getOrNull(1)) -> "g"
            else -> null
        }
    }

    private fun esLetraODigito(c: Char?): Boolean = c != null && c.isLetterOrDigit()

    companion object {
        // Trama real: una letra de estado (S=estable, U=inestable) pegada a un entero, p. ej. "S1460".
        private val TRAMA_ESTADO_REGEX = Regex("""^([SsUu])\s*([+-]?\d+(?:[.,]\d+)?)$""")

        /** El entero de la trama viene en gramos; se divide para obtener kg. */
        private const val DIVISOR_A_KG = 1000.0

        private val NUMBER_REGEX = Regex("""([+-]?\d+(?:[.,]\d+)?)""")
        // ',' NO invalida: muchas básculas separan campos con coma ("ST,GS,+2.345kg").
        private val PEGADO_ANTES = charArrayOf('.', ':', '/', '-')
        private val PEGADO_DESPUES = charArrayOf('.', ':', '/', '-')

        /** Enteros sin unidad desde este valor se interpretan como gramos (pesos de aves). */
        private const val UMBRAL_ENTERO_GRAMOS = 50.0

        /** Cota de sanidad para pesaje avícola: descarta timestamps/contadores colados. */
        private const val MAX_KG_AVICOLA = 50.0
    }
}

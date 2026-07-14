package com.rommel.scaleprototype

import kotlin.math.abs

/**
 * Bröring BIT PS 4.0 IoT (báscula avícola) — parser PROVISIONAL.
 *
 * El manual oficial (EN/DE, broeringtech.com/files/manuals/BITPS_Manual_EN_DE.pdf) no publica
 * el formato de la trama Bluetooth: la báscula está pensada para la app del propio fabricante
 * (Bluetooth clásico, nombre "SCALE-<serie>", p. ej. SCALE-2023-0123) y, en la variante IoT,
 * para subir series por WiFi a un servidor. Hasta obtener el protocolo real (pedirlo a
 * appstore@broeringtech.com / info@broeringtech.com) o una captura con la pantalla
 * "Diagnóstico Bluetooth" (casilla "hex"), este parser aplica una heurística de texto más
 * estricta que [GenericRegexProtocol] y adaptada a esta báscula:
 *
 *  - acepta coma decimal ("2,345 kg", formato alemán) además de punto;
 *  - prefiere el primer número CON unidad explícita (kg/g) sobre números sueltos, para no
 *    confundir contadores de muestra (p. ej. "No. 15") con el peso;
 *  - sin unidad: con decimales se asume kg; un entero >= 50 se asume gramos ("2345" -> 2.345 kg,
 *    típico en aves) y un entero < 50 se asume kg;
 *  - descarta horas/fechas/números de serie (tokens pegados a ':', '/', '-' o '.') y valores
 *    fuera de rango para pesaje avícola (|peso| > 50 kg).
 *
 * Devuelve SIEMPRE kg — [com.rommel.scaleprototype.ui.CaptureFragment] asume ese contrato para
 * todos los `ScaleProtocol`.
 *
 * IMPORTANTE: al probar con la báscula física, validar en "Diagnóstico Bluetooth" que las
 * lecturas coinciden con el display; si el firmware envía otro formato (p. ej. binario),
 * capturar unas líneas en hex y ajustar este parser al formato real en vez de adivinar.
 */
class BitPs40Protocol : ScaleProtocol {
    override val id: String = "bitps-40-iot"
    override val displayName: String = "BIT PS 4.0 IoT (Bröring, provisional)"

    override fun parse(line: String): ParsedWeight? {
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

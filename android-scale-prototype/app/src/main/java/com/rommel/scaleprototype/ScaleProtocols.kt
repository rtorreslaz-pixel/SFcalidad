package com.rommel.scaleprototype

/**
 * Catálogo de protocolos disponibles, mostrado como lista en la UI para elegir cómo
 * decodificar la báscula conectada. Para agregar soporte a una marca nueva: crear una
 * clase que implemente [ScaleProtocol] y sumarla a esta lista.
 */
object ScaleProtocols {
    // Importante: agregar protocolos nuevos siempre al final. El índice de selección se
    // persiste en SharedPreferences (ver KEY_LAST_PROTOCOL_INDEX); insertar en el medio
    // correría los índices y cambiaría el protocolo recordado en instalaciones existentes.
    val all: List<ScaleProtocol> = listOf(
        OhausRangerProtocol(),
        GenericRegexProtocol(),
        TScaleBwProtocol()
    )

    val default: ScaleProtocol = all.first()
}

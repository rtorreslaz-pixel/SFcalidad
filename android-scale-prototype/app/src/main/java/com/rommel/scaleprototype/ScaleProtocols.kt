package com.rommel.scaleprototype

/**
 * Catálogo de protocolos disponibles, mostrado como lista en la UI para elegir cómo
 * decodificar la báscula conectada. Para agregar soporte a una marca nueva: crear una
 * clase que implemente [ScaleProtocol] y sumarla a esta lista.
 */
object ScaleProtocols {
    val all: List<ScaleProtocol> = listOf(
        GenericRegexProtocol()
    )

    val default: ScaleProtocol = all.first()
}

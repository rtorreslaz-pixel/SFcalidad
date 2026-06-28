package com.rommel.scaleprototype

sealed class ScaleEvent {
    data class Status(val message: String) : ScaleEvent()
    object Connected : ScaleEvent()
    object Disconnected : ScaleEvent()
    data class Error(val message: String) : ScaleEvent()
    data class RawLine(val text: String) : ScaleEvent()
}

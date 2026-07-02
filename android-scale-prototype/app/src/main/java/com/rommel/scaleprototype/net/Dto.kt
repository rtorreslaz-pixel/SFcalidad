package com.rommel.scaleprototype.net

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class LoginResponseUser(val id: String, val nombre: String, val email: String)

@Serializable
data class LoginResponse(val token: String, val user: LoginResponseUser)

@Serializable
// nombre es nullable porque Plantel.nombre lo es en el schema -- hay planteles
// que solo tienen codigo asignado todavia.
data class PlantelDto(val id: String, val codigo: String, val nombre: String? = null, val cliente: String? = null)

@Serializable
data class CatalogosResponse(val planteles: List<PlantelDto>)

// categoria viaja como String (no como el enum de Kotlin) para no acoplar nombres
// de enum entre Android y el servidor.
@Serializable
data class RegistroDto(
    val id: String,
    val plantelId: String,
    val campania: String? = null,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val numeroAve: Int,
    val pesoGramos: Double,
    val fechaHora: String,
    // Metadatos del lote -- null en registros anteriores a este campo.
    val edad: Int? = null,
    val linea: String? = null,
    val lote: String? = null,
    val nAvesPorPesada: Int? = null,
    // Calidad evaluada opcionalmente sobre esta misma ave -- null si no se evaluó.
    val tieneHematoma: Boolean? = null,
    val tieneDefectoSeleccion: Boolean? = null,
    val gradoPododermatitis: Int? = null,
    val gradoRasguno: Int? = null,
    val pigmentacion: Int? = null,
)

@Serializable
data class RegistrosBatchRequest(val registros: List<RegistroDto>)

@Serializable
data class RegistrosBatchResponse(val ingested: Int, val ids: List<String>)

@Serializable
data class ApiErrorResponse(val error: String)

@Serializable
data class LiveWeightRequest(
    val pesoGramos: Double,
    val plantelCodigo: String? = null,
    val campania: String? = null,
    val galpon: String? = null,
    val corral: String? = null,
    val categoria: String? = null,
)

@Serializable
data class NumeroAveMaxResponse(val maxNumeroAve: Int? = null)

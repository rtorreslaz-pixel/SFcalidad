package com.rommel.scaleprototype.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "registro_peso")
data class RegistroPeso(
    @PrimaryKey val id: String,
    val plantelId: String,
    val plantelCodigo: String,
    val campania: String,
    val galpon: String,
    val corral: String,
    val categoria: String,
    val numeroAve: Int,
    val pesoGramos: Double,
    val fechaHoraEpochMillis: Long,
    // Calidad evaluada opcionalmente sobre esta misma ave (null = no evaluada en esta ave).
    val tieneHematoma: Boolean? = null,
    val tieneDefectoSeleccion: Boolean? = null,
    val gradoPododermatitis: Int? = null,
    val gradoRasguno: Int? = null,
    val pigmentacion: Int? = null,
    // Metadatos del lote capturados en CaptureSetupFragment.
    val edad: Int? = null,           // días de vida del lote al momento de la pesada
    val linea: String? = null,       // línea genética (Ross, Cobb, etc.)
    val lote: String? = null,        // J (Joven) / A (Adulto)
    val nAvesPorPesada: Int = 1,     // N° aves pesadas juntas en cada lectura de báscula
    // Quién estaba logueado al CREAR el registro. El servidor atribuye cada registro a
    // quien esté logueado al SUBIRLO, así que si otro usuario inicia sesión en este
    // teléfono con pendientes ajenos, el login se lo advierte (ver LoginFragment).
    // Null solo en filas creadas por versiones anteriores de la app.
    val verificadorId: String? = null,
    val verificadorNombre: String? = null,
    val synced: Boolean = false,
    val createdAtEpochMillis: Long,
)

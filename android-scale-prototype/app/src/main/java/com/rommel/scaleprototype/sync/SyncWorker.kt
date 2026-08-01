package com.rommel.scaleprototype.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.RegistroPeso
import com.rommel.scaleprototype.data.SacaMuestreo
import com.rommel.scaleprototype.data.SacaPesada
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ApiException
import com.rommel.scaleprototype.net.RegistroDto
import com.rommel.scaleprototype.net.SacaMuestreoDto
import com.rommel.scaleprototype.net.SacaPesadaDto
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val db = AppDatabase.getInstance(applicationContext)
        val dao = db.registroPesoDao()
        val sacaDao = db.sacaDao()
        val apiClient = ApiClient.getInstance(applicationContext)

        return try {
            var batch = dao.getUnsyncedBatch(BATCH_SIZE)
            while (batch.isNotEmpty()) {
                apiClient.postRegistros(batch.map { it.toDto() })
                dao.markSynced(batch.map { it.id })
                batch = dao.getUnsyncedBatch(BATCH_SIZE)
            }

            // Muestreos de saca: van con sus pesadas y son idempotentes por id, igual que los
            // pesos de preventa, así que un reintento no duplica nada en el servidor.
            var sacas = sacaDao.getUnsyncedMuestreos(SACA_BATCH_SIZE)
            while (sacas.isNotEmpty()) {
                val dtos = sacas.map { m -> m.toDto(sacaDao.getPesadas(m.id)) }
                apiClient.postSaca(dtos)
                sacaDao.markSynced(sacas.map { it.id })
                sacas = sacaDao.getUnsyncedMuestreos(SACA_BATCH_SIZE)
            }
            Result.success()
        } catch (e: ApiException) {
            when {
                // Token revocado o rotado desde el admin: no tiene sentido reintentar con el
                // mismo token. Se borra la sesión local para que la pantalla de captura mande
                // al verificador de vuelta al login en su próximo onResume.
                e.code == 401 -> {
                    AuthRepository(applicationContext).logout()
                    Result.failure()
                }
                e.code in 500..599 -> Result.retry()
                else -> Result.failure()
            }
        } catch (e: IOException) {
            Result.retry()
        }
    }

    companion object {
        const val UNIQUE_WORK_NAME = "sync_registros_peso"
        private const val BATCH_SIZE = 50
        // Cada muestreo de saca lleva sus pesadas, así que se suben de a pocos.
        private const val SACA_BATCH_SIZE = 10

        private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        private fun RegistroPeso.toDto() = RegistroDto(
            id = id,
            plantelId = plantelId,
            campania = campania,
            galpon = galpon,
            corral = corral,
            categoria = categoria,
            numeroAve = numeroAve,
            // En solo calidad no se envía peso (el servidor lo acepta null para tipo CALIDAD).
            pesoGramos = if (tipoMuestreo == "CALIDAD") null else pesoGramos,
            tipoMuestreo = tipoMuestreo,
            fechaHora = isoFormat.format(Date(fechaHoraEpochMillis)),
            edad = edad,
            linea = linea,
            lote = lote,
            nAvesPorPesada = nAvesPorPesada,
            tieneHematoma = tieneHematoma,
            tieneDefectoSeleccion = tieneDefectoSeleccion,
            gradoPododermatitis = gradoPododermatitis,
            gradoRasguno = gradoRasguno,
            pigmentacion = pigmentacion,
        )

        private fun SacaMuestreo.toDto(pesadas: List<SacaPesada>) = SacaMuestreoDto(
            id = id,
            plantelId = plantelId,
            campania = campania,
            galpon = galpon,
            categoria = categoria,
            fecha = isoFormat.format(Date(fechaEpochMillis)),
            edad = edad,
            avesPorJaba = avesPorJaba,
            taraGramosPorJaba = taraGramosPorJaba,
            tipoJaba = tipoJaba,
            pesadas = pesadas.map { p ->
                SacaPesadaDto(
                    id = p.id,
                    numJabas = p.numJabas,
                    pesoBrutoGramos = p.pesoBrutoGramos,
                    pesoNetoGramos = p.pesoNetoGramos,
                    avesTotal = p.avesTotal,
                    promedioGramos = p.promedioGramos,
                    fechaHora = isoFormat.format(Date(p.fechaHoraEpochMillis)),
                )
            },
        )
    }
}

package com.rommel.scaleprototype.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.rommel.scaleprototype.data.AppDatabase
import com.rommel.scaleprototype.data.RegistroPeso
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ApiException
import com.rommel.scaleprototype.net.RegistroDto
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val dao = AppDatabase.getInstance(applicationContext).registroPesoDao()
        val apiClient = ApiClient.getInstance(applicationContext)

        return try {
            var batch = dao.getUnsyncedBatch(BATCH_SIZE)
            while (batch.isNotEmpty()) {
                apiClient.postRegistros(batch.map { it.toDto() })
                dao.markSynced(batch.map { it.id })
                batch = dao.getUnsyncedBatch(BATCH_SIZE)
            }
            Result.success()
        } catch (e: ApiException) {
            if (e.code in 500..599) Result.retry() else Result.failure()
        } catch (e: IOException) {
            Result.retry()
        }
    }

    companion object {
        const val UNIQUE_WORK_NAME = "sync_registros_peso"
        private const val BATCH_SIZE = 50

        private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        private fun RegistroPeso.toDto() = RegistroDto(
            id = id,
            plantelId = plantelId,
            galpon = galpon,
            corral = corral,
            categoria = categoria,
            numeroAve = numeroAve,
            pesoGramos = pesoGramos,
            fechaHora = isoFormat.format(Date(fechaHoraEpochMillis)),
        )
    }
}

package com.rommel.scaleprototype.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.room.migration.Migration

@Database(entities = [RegistroPeso::class], version = 2, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {

    abstract fun registroPesoDao(): RegistroPesoDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        // Filas existentes no tienen campania -- se quedan en '' y simplemente
        // re-empiezan su conteo de numeroAve cuando se les asigne una campania real.
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN campania TEXT NOT NULL DEFAULT ''")
            }
        }

        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "scale-prototype.db",
                    // Sin fallbackToDestructiveMigration(): un futuro cambio de esquema
                    // debe ir por una Migration real, no borrar la cola de un verificador.
                ).addMigrations(MIGRATION_1_2).build().also { instance = it }
            }
        }
    }
}

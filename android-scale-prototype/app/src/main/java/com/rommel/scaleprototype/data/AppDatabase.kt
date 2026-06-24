package com.rommel.scaleprototype.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [RegistroPeso::class], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {

    abstract fun registroPesoDao(): RegistroPesoDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "scale-prototype.db",
                    // Sin fallbackToDestructiveMigration(): un futuro cambio de esquema
                    // debe ir por una Migration real, no borrar la cola de un verificador.
                ).build().also { instance = it }
            }
        }
    }
}

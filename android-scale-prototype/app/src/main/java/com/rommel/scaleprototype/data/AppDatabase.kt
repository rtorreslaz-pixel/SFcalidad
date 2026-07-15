package com.rommel.scaleprototype.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.room.migration.Migration

@Database(entities = [RegistroPeso::class], version = 5, exportSchema = true)
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

        // Columnas de calidad por ave, todas nullable -- filas existentes quedan sin
        // evaluar (NULL), igual que cualquier ave nueva donde no se activa "Evaluar calidad".
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN tieneHematoma INTEGER")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN tieneDefectoSeleccion INTEGER")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN gradoPododermatitis INTEGER")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN gradoRasguno INTEGER")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN pigmentacion INTEGER")
            }
        }

        // Campos de cabecera del lote: edad en días, línea genética, lote (J/A) y N° aves
        // por pesada. Todos opcionales para filas existentes (null / default 1).
        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN edad INTEGER")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN linea TEXT")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN lote TEXT")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN nAvesPorPesada INTEGER NOT NULL DEFAULT 1")
            }
        }

        // Quién creó cada registro (para advertir si otro usuario va a subir pendientes
        // ajenos). Filas existentes quedan NULL: dueño desconocido, no se advierte.
        private val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN verificadorId TEXT")
                db.execSQL("ALTER TABLE registro_peso ADD COLUMN verificadorNombre TEXT")
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
                ).addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
                    .build().also { instance = it }
            }
        }
    }
}

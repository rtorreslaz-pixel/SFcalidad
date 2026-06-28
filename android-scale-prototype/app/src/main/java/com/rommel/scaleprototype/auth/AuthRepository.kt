package com.rommel.scaleprototype.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class AuthRepository(context: Context) {

    private val prefs = EncryptedSharedPreferences.create(
        context.applicationContext,
        PREFS_FILE_NAME,
        MasterKey.Builder(context.applicationContext).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun saveSession(token: String, verificadorId: String, verificadorNombre: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_VERIFICADOR_ID, verificadorId)
            .putString(KEY_VERIFICADOR_NOMBRE, verificadorNombre)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getVerificadorNombre(): String? = prefs.getString(KEY_VERIFICADOR_NOMBRE, null)

    fun isLoggedIn(): Boolean = getToken() != null

    fun logout() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "scale_auth_prefs"
        private const val KEY_TOKEN = "api_token"
        private const val KEY_VERIFICADOR_ID = "verificador_id"
        private const val KEY_VERIFICADOR_NOMBRE = "verificador_nombre"
    }
}

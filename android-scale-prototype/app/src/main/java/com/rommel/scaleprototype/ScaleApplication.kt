package com.rommel.scaleprototype

import android.app.Application
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkRequest
import com.rommel.scaleprototype.sync.SyncScheduler

class ScaleApplication : Application() {

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            SyncScheduler.scheduleSyncNow(applicationContext)
        }
    }

    override fun onCreate() {
        super.onCreate()
        SyncScheduler.schedulePeriodicSafetyNet(applicationContext)

        val connectivityManager = getSystemService(ConnectivityManager::class.java)
        connectivityManager.registerNetworkCallback(NetworkRequest.Builder().build(), networkCallback)
    }
}

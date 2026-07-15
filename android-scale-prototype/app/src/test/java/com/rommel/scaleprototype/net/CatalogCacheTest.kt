package com.rommel.scaleprototype.net

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class CatalogCacheTest {

    private val context = ApplicationProvider.getApplicationContext<Context>()

    @Test
    fun `empty cache returns null`() {
        assertNull(CatalogCache(context).load())
        assertEquals(0L, CatalogCache(context).savedAtMillis())
    }

    @Test
    fun `save then load returns the same raw json`() {
        val cache = CatalogCache(context)
        val raw = """{"planteles":[{"id":"p1","codigo":"P006","nombre":null,"cliente":"AKIM"}],"pesosEstandar":[]}"""
        cache.save(raw)
        assertEquals(raw, cache.load())
        assertTrue(cache.savedAtMillis() > 0L)
    }

    @Test
    fun `a new save replaces the previous one`() {
        val cache = CatalogCache(context)
        cache.save("""{"planteles":[],"pesosEstandar":[]}""")
        val newer = """{"planteles":[{"id":"p2","codigo":"P007","nombre":null,"cliente":null}],"pesosEstandar":[]}"""
        cache.save(newer)
        assertEquals(newer, cache.load())
    }
}

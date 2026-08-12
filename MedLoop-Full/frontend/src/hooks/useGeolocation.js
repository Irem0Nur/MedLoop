import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

/**
 * Cihazın gerçek konumuna erişir.
 *
 * Native (Android/iOS, Capacitor ile paketlenmiş uygulama) ortamda
 * @capacitor/geolocation plugin'ini kullanır — çünkü WebView içinde
 * navigator.geolocation güvenilir şekilde çalışmaz/izin penceresi
 * çıkmaz. Web (tarayıcıda çalışan medloop-full-frontend.onrender.com)
 * ortamında ise standart navigator.geolocation API'sine düşer.
 * Capacitor.isNativePlatform() bu ayrımı otomatik yapar, ekstra
 * konfigürasyon gerekmez.
 *
 * Durumlar:
 *  - 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error'
 *
 * Konum reddedilir/alınamazsa `fallback` koordinatına düşer (haritanın
 * boş kalmaması için) — status yine gerçek durumu yansıtır, arayüz
 * buna göre kullanıcıyı bilgilendirebilir.
 */
export function useGeolocation({ fallback } = {}) {
  const [status, setStatus] = useState('idle')
  const [position, setPosition] = useState(fallback ?? null)

  useEffect(() => {
    let cancelled = false

    async function requestNativeLocation() {
      setStatus('requesting')
      try {
        const permission = await Geolocation.requestPermissions()
        const granted =
          permission.location === 'granted' || permission.coarseLocation === 'granted'

        if (!granted) {
          if (!cancelled) {
            setStatus('denied')
            if (fallback) setPosition(fallback)
          }
          return
        }

        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        })

        if (!cancelled) {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          // Capacitor plugin izin reddinde de genelde hata fırlatır
          const denied = err?.message?.toLowerCase().includes('denied')
          setStatus(denied ? 'denied' : 'error')
          if (fallback) setPosition(fallback)
        }
      }
    }

    function requestWebLocation() {
      if (!navigator.geolocation) {
        setStatus('unavailable')
        return
      }
      setStatus('requesting')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setStatus('ready')
        },
        (err) => {
          if (cancelled) return
          setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
          if (fallback) setPosition(fallback)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
      )
    }

    if (Capacitor.isNativePlatform()) {
      requestNativeLocation()
    } else {
      requestWebLocation()
    }

    return () => {
      cancelled = true
    }
  }, [fallback])

  return { status, position }
}
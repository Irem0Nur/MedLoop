import { useEffect, useState } from 'react'

/**
 * Cihazın gerçek konumuna (Geolocation API) erişir.
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
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ready')
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
        if (fallback) setPosition(fallback)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    )
    return () => {
      if (typeof watchId === 'number' && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [fallback])

  return { status, position }
}
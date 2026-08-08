import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cihaz kamerasına canlı erişim sağlayan hook.
 *
 * Durumlar:
 *  - 'idle'      → kamera henüz istenmedi
 *  - 'requesting'→ izin isteniyor
 *  - 'ready'     → video akışı hazır, kare yakalanabilir
 *  - 'denied'    → kullanıcı izni reddetti
 *  - 'unavailable' → cihazda kamera yok / desteklenmiyor
 *  - 'error'     → beklenmeyen hata
 *
 * NOT: Bu hook sadece cihaz kamerasına erişimi yönetir. Yakalanan karenin
 * ilaç kutusu olarak tanınması (OCR/barkod) backend tarafının işi —
 * bkz. src/mock/scanService.js içindeki entegrasyon noktası.
 */
export function useCamera({ facingMode = 'environment' } = {}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const [track] = stream.getVideoTracks()
      const capabilities = track.getCapabilities?.() ?? {}
      setTorchSupported(Boolean(capabilities.torch))

      setStatus('ready')
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatus('denied')
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setStatus('unavailable')
      } else {
        setStatus('error')
      }
    }
  }, [facingMode])

  const toggleTorch = useCallback(async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? []
    if (!track || !torchSupported) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn((prev) => !prev)
    } catch {
      // Bazı tarayıcılar torch'u destekler ama constraint uygulanamaz;
      // sessizce yok say, buton pasif kalır.
    }
  }, [torchOn, torchSupported])

  /** Video akışından bir kare yakalayıp base64 JPEG olarak döndürür. */
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  useEffect(() => {
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    videoRef,
    status,
    torchSupported,
    torchOn,
    toggleTorch,
    captureFrame,
    retry: start,
  }
}

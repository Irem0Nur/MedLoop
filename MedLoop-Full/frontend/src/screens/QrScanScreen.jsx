import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { useCamera } from '../hooks/useCamera.js'

/**
 * İlaç Tara'daki tek-karelik yakalamadan farklı olarak, burada video akışı
 * her animasyon karesinde taranır (requestAnimationFrame + jsQR) — gerçek
 * bir QR okuyucu deneyimi. Geçerli bir MedLoop teslimat QR'ı bulununca
 * `onScanned` çağrılır.
 *
 * @param {(payload: { type: string, citizenName: string, items: object[] }) => void} onScanned
 */
export default function QrScanScreen({ onScanned, onBack }) {
  const { videoRef, status } = useCamera({ facingMode: 'environment' })
  const [scanError, setScanError] = useState(null)
  const canvasRef = useRef(document.createElement('canvas'))
  const rafRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    if (status !== 'ready') return

    const tick = () => {
      if (doneRef.current) return
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          try {
            const payload = JSON.parse(code.data)
            if (payload?.type === 'medloop-delivery' && Array.isArray(payload.items)) {
              doneRef.current = true
              onScanned(payload)
              return
            }
            setScanError('Bu QR kod bir MedLoop teslimatı değil.')
          } catch {
            setScanError('QR kod okunamadı, tekrar dene.')
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [status, videoRef, onScanned])

  return (
    <div className="app-shell flex flex-col bg-night-900">
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/70 via-transparent to-night-900/85 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri dön"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-semibold text-white text-base">QR Doğrula</h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {status !== 'ready' && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <CameraStatusMessage status={status} />
        </div>
      )}

      {status === 'ready' && (
        <>
          <p className="relative z-10 text-center text-white/85 text-sm px-10 mt-2">
            Vatandaşın teslimat QR kodunu çerçeve içine getir.
          </p>
          <div className="absolute inset-0">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-64 h-64 rounded-3xl border-4 border-white/80" />
            <span className="text-xs font-semibold text-white/70 tracking-wide" role="status" aria-live="polite">
              {scanError ?? 'TARANIYOR...'}
            </span>
          </div>
        </>
      )}

      <div className="relative z-10 pb-10" />
    </div>
  )
}

function CameraStatusMessage({ status }) {
  const copy = {
    requesting: { title: 'Kamera açılıyor', body: 'Tarayıcının kamera izni istediğini göreceksin.' },
    denied: { title: 'Kamera izni verilmedi', body: 'QR okutabilmek için tarayıcı ayarlarından kamera izni ver.' },
    unavailable: { title: 'Kamera bulunamadı', body: 'Bu cihazda kullanılabilir bir kamera yok.' },
    error: { title: 'Kamera başlatılamadı', body: 'Beklenmeyen bir sorun oluştu, geri dönüp tekrar dene.' },
    idle: { title: 'Kamera hazırlanıyor', body: '' },
  }[status]

  return (
    <div className="text-center flex flex-col items-center gap-2">
      <h2 className="font-display font-semibold text-white text-lg">{copy.title}</h2>
      {copy.body && <p className="text-white/70 text-sm">{copy.body}</p>}
    </div>
  )
}
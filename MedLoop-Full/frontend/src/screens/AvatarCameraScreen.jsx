import { useState } from 'react'
import { useCamera } from '../hooks/useCamera.js'

/**
 * Avatar için gerçek kamera akışı — dosya input'unun `capture` attribute'una
 * güvenmek yerine (bazı tarayıcı/cihaz kombinasyonlarında dosya seçiciye
 * düşüyor, kamerayı garanti açmıyor) İlaç Tara ekranındaki aynı getUserMedia
 * tekniğini kullanır. Böylece kamera her cihazda tutarlı şekilde açılır.
 *
 * @param {(image: string) => void} onCapture
 */
export default function AvatarCameraScreen({ onCapture, onCancel }) {
  const { videoRef, status, captureFrame } = useCamera({ facingMode: 'user' })
  const [previewImage, setPreviewImage] = useState(null)

  const handleCapture = () => {
    const frame = captureFrame()
    if (frame) setPreviewImage(frame)
  }

  const handleUse = () => {
    if (previewImage) onCapture?.(previewImage)
  }

  return (
    <div className="app-shell flex flex-col bg-night-900">
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/60 via-transparent to-night-900/80 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Vazgeç"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-semibold text-white text-base">Profil Fotoğrafı</h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {status !== 'ready' && !previewImage && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <CameraStatusMessage status={status} />
        </div>
      )}

      {status === 'ready' && !previewImage && (
        <>
          <div className="absolute inset-0">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border-4 border-white/70 shadow-[0_0_0_9999px_rgba(12,35,24,0.55)]" />
          </div>
        </>
      )}

      {previewImage && (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <img src={previewImage} alt="Önizleme" className="w-64 h-64 rounded-full object-cover border-4 border-white/70" />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center gap-10 pb-10">
        {previewImage ? (
          <>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="px-5 h-12 rounded-full bg-white/10 backdrop-blur text-white text-sm font-semibold"
            >
              Tekrar Çek
            </button>
            <button
              type="button"
              onClick={handleUse}
              className="px-5 h-12 rounded-full bg-forest-600 text-white text-sm font-semibold"
            >
              Kullan
            </button>
          </>
        ) : (
          status === 'ready' && (
            <button
              type="button"
              onClick={handleCapture}
              aria-label="Fotoğraf çek"
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-lg"
            >
              <span className="w-14 h-14 rounded-full border-2 border-night-900" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

function CameraStatusMessage({ status }) {
  const copy = {
    requesting: { title: 'Kamera açılıyor', body: 'Tarayıcının kamera izni istediğini göreceksin.' },
    denied: { title: 'Kamera izni verilmedi', body: 'Fotoğraf çekebilmek için tarayıcı ayarlarından kamera izni ver.' },
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
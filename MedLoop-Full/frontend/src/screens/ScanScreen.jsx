import { useCallback, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera.js'
import { recognizeMedicine } from '../mock/scanService.js'
import ViewfinderCorners from '../components/ViewfinderCorners.jsx'
import BottomNav from '../components/BottomNav.jsx'

const STATUS_TEXT = {
  waiting: 'TARANMAYI BEKLİYOR...',
  scanning: 'TARANIYOR...',
  success: 'ÜRÜN TANINDI',
  failed: 'TANINAMADI, TEKRAR DENEYİN',
}

/**
 * @param {(payload: { image: string, draft: object }) => void} onScanSuccess
 *   Tarama başarılı olduğunda çağrılır; App bu callback ile ilaç ekleme
 *   formunu açar (yalnızca başarılı taramada — kullanıcı tercihi).
 */
export default function ScanScreen({ onBack, onScanSuccess }) {
  const { videoRef, status: cameraStatus, torchSupported, torchOn, toggleTorch, captureFrame, retry } =
    useCamera()
  const [scanStatus, setScanStatus] = useState('waiting') // waiting | scanning | success | failed
  const fileInputRef = useRef(null)
  const busy = scanStatus === 'scanning'

  const runRecognition = useCallback(async (imageDataUrl) => {
    setScanStatus('scanning')
    try {
      const draft = await recognizeMedicine(imageDataUrl)
      setScanStatus('success')
      // Kullanıcı sonucu görsün diye kısa bir an bekleyip forma geç.
      setTimeout(() => onScanSuccess?.({ image: imageDataUrl, draft }), 550)
    } catch {
      setScanStatus('failed')
      setTimeout(() => setScanStatus('waiting'), 1600)
    }
  }, [onScanSuccess])

  const handleCapture = () => {
    if (busy || cameraStatus !== 'ready') return
    const frame = captureFrame()
    if (!frame) return
    runRecognition(frame)
  }

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => runRecognition(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="app-shell flex flex-col bg-night-900">
      {/* Kamera akışı */}
      <div className="absolute inset-0">
        {cameraStatus === 'ready' ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-night-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-night-900/80 via-transparent to-night-900/90" />
      </div>

      {/* Üst bar */}
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
        <h1 className="font-display font-semibold text-white text-base">İlaç Tara</h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {/* Kamera durum mesajları (izin yok / kamera yok / hata) */}
      {cameraStatus !== 'ready' && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <CameraStatusMessage status={cameraStatus} onRetry={retry} onUseFile={() => fileInputRef.current?.click()} />
        </div>
      )}

      {cameraStatus === 'ready' && (
        <>
          <p className="relative z-10 text-center text-white/85 text-sm px-10 mt-2">
            İlaç kutusunu çerçeve içine yerleştirin.
          </p>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
            <ViewfinderCorners state={scanStatus === 'failed' ? 'waiting' : scanStatus} />
            <span
              className={`text-xs font-semibold tracking-wide ${
                scanStatus === 'success' ? 'text-sage-400' : scanStatus === 'failed' ? 'text-rose-500' : 'text-white/70'
              }`}
              role="status"
              aria-live="polite"
            >
              {STATUS_TEXT[scanStatus]}
            </span>
          </div>
        </>
      )}

      {/* Alt kontrol satırı */}
      {cameraStatus === 'ready' && (
        <div className="relative z-10 flex items-center justify-center gap-10 pb-32">
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!torchSupported}
            aria-label="Fener"
            aria-pressed={torchOn}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur transition-colors ${
              torchOn ? 'bg-amber-400 text-night-900' : 'bg-white/10 text-white'
            } disabled:opacity-30`}
          >
            <BoltIcon />
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={busy}
            aria-label="Tara"
            className="w-[72px] h-[72px] rounded-full bg-forest-600 flex items-center justify-center shadow-lg shadow-forest-900/40 disabled:opacity-60"
          >
            {busy ? <SpinnerIcon /> : <ScanTargetIcon />}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Galeriden seç"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
          >
            <ImageIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFilePicked}
          />
        </div>
      )}

      <BottomNav active="scan" />
    </div>
  )
}

function CameraStatusMessage({ status, onRetry, onUseFile }) {
  const copy = {
    requesting: {
      title: 'Kamera açılıyor',
      body: 'Tarayıcının kamera izni istediğini göreceksin.',
    },
    denied: {
      title: 'Kamera izni verilmedi',
      body: 'Taramayı kullanabilmek için tarayıcı ayarlarından MedLoop’a kamera izni ver.',
    },
    unavailable: {
      title: 'Kamera bulunamadı',
      body: 'Bu cihazda kullanılabilir bir kamera yok. Bunun yerine bir fotoğraf seçebilirsin.',
    },
    error: {
      title: 'Kamera başlatılamadı',
      body: 'Beklenmeyen bir sorun oluştu. Tekrar dene ya da bir fotoğraf seç.',
    },
    idle: {
      title: 'Kamera hazırlanıyor',
      body: '',
    },
  }[status]

  return (
    <div className="text-center flex flex-col items-center gap-4">
      <h2 className="font-display font-semibold text-white text-lg">{copy.title}</h2>
      {copy.body && <p className="text-white/70 text-sm">{copy.body}</p>}
      <div className="flex gap-3 mt-2">
        {status !== 'requesting' && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-full bg-forest-600 text-white text-sm font-medium"
          >
            Tekrar Dene
          </button>
        )}
        <button
          type="button"
          onClick={onUseFile}
          className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium"
        >
          Fotoğraf Seç
        </button>
      </div>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}
function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  )
}
function ScanTargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

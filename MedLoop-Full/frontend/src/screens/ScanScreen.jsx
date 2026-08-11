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

export default function ScanScreen({ onBack, onScanSuccess }) {
  const { status: cameraStatus, captureFrame, retry } = useCamera()
  const [scanStatus, setScanStatus] = useState('waiting')
  const fileInputRef = useRef(null)
  const busy = scanStatus === 'scanning'

  const runRecognition = useCallback(async (imageDataUrl) => {
    setScanStatus('scanning')
    try {
      const draft = await recognizeMedicine(imageDataUrl)
      setScanStatus('success')
      setTimeout(() => onScanSuccess?.({ image: imageDataUrl, draft }), 550)
    } catch {
      setScanStatus('failed')
      setTimeout(() => setScanStatus('waiting'), 1600)
    }
  }, [onScanSuccess])

  const handleCapture = async () => {
    if (busy || cameraStatus !== 'ready') return
    const frame = await captureFrame()
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
    <div id="camera-preview-container" className="app-shell flex flex-col" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/40 via-transparent to-night-900/70 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button type="button" onClick={onBack} aria-label="Geri dön"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-semibold text-white text-base">İlaç Tara</h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {cameraStatus !== 'ready' && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <p className="text-white/70 text-sm text-center">
            {cameraStatus === 'error' ? 'Kamera başlatılamadı.' : 'Kamera hazırlanıyor...'}
          </p>
        </div>
      )}

      {cameraStatus === 'ready' && (
        <>
          <p className="relative z-10 text-center text-white/85 text-sm px-10 mt-2">
            İlaç kutusunu çerçeve içine yerleştirin.
          </p>
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
            <ViewfinderCorners state={scanStatus === 'failed' ? 'waiting' : scanStatus} />
            <span className={`text-xs font-semibold tracking-wide ${
              scanStatus === 'success' ? 'text-sage-400' : scanStatus === 'failed' ? 'text-rose-500' : 'text-white/70'
            }`} role="status" aria-live="polite">
              {STATUS_TEXT[scanStatus]}
            </span>
          </div>
        </>
      )}

      {cameraStatus === 'ready' && (
        <div className="relative z-10 flex items-center justify-center gap-10 pb-32">
          <div className="w-12 h-12" aria-hidden="true" />
          <button type="button" onClick={handleCapture} disabled={busy} aria-label="Tara"
            className="w-[72px] h-[72px] rounded-full bg-forest-600 flex items-center justify-center shadow-lg shadow-forest-900/40 disabled:opacity-60">
            <ScanTargetIcon />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Galeriden seç"
            className="w-12 h-12 rounded-full bg-pink-500 backdrop-blur flex items-center justify-center text-white">
            <ImageIcon />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePicked} />
        </div>
      )}

      <BottomNav active="scan" />
    </div>
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
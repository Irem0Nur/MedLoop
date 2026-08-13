import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Vatandaş seçtiği ilaçlar için backend'e POST /deliveries/request atar
 * (bkz. App.jsx handleGenerateQr); dönen kısa ömürlü `token` QR koduna
 * gömülür. Eczacı bu QR'ı gerçek kamerayla (jsQR) okur — bkz.
 * QrScanScreen.jsx — ve token backend'de GET/POST /deliveries/<token>
 * ile doğrulanır. QR'ın içinde ilaç verisi YOK, sadece token var; bu
 * yüzden onay sunucu tarafında gerçekten gerçekleşir (sahte QR üretilemez).
 *
 * @param {{ token: string, items: object[], expiresAt: string }} delivery
 */
export default function DeliveryQRScreen({ delivery, onBack }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)

  const payload = { type: 'medloop-delivery', token: delivery?.token }

  useEffect(() => {
    if (!canvasRef.current || !delivery?.token) return
    QRCode.toCanvas(canvasRef.current, JSON.stringify(payload), {
      width: 256,
      margin: 1,
      color: { dark: '#0e2e20', light: '#ffffff' },
    }).catch(() => setError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.token])

  const items = delivery?.items ?? []
  const expiresAt = delivery?.expiresAt ? new Date(delivery.expiresAt) : null

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center gap-3 px-4 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri dön"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-forest-900 text-lg">Teslimat QR Kodu</h1>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="glass-card rounded-3xl p-6 flex items-center justify-center">
          {error || !delivery?.token ? (
            <p className="text-sm text-rose-500 w-64 text-center">QR kod oluşturulamadı, geri dönüp tekrar dene.</p>
          ) : (
            <canvas ref={canvasRef} className="rounded-xl" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-forest-900">Bu QR kodu eczacıya göster</p>
          <p className="text-xs text-forest-700/60 mt-1">
            {items.length} ilaç · eczacı QR Tara ile onayladığında dolabından düşer ve puan kazanırsın.
          </p>
          {expiresAt && (
            <p className="text-[11px] text-forest-700/45 mt-1">
              QR {expiresAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'e kadar geçerli.
            </p>
          )}
        </div>

        <ul className="w-full flex flex-col gap-2">
          {items.map((m) => (
            <li key={m.id} className="glass-card rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-medium text-forest-900">{m.name}</span>
              <span className="text-xs text-forest-700/60">{m.quantity} adet</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

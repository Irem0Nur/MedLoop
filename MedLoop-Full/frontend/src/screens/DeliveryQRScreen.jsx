import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * QR koduna sadece backend'in ürettiği kısa ömürlü `token`'ı gömer (ilaç
 * verisi ya da vatandaş bilgisi QR'da DEĞİL — güvenlik için). Eczacı
 * taradığında bu token'la GET /deliveries/<token> çağrılıp teslimat sunucu
 * tarafında doğrulanır (bkz. QrScanScreen, DeliveryConfirmScreen).
 *
 * @param {object} delivery - POST /deliveries/request'ten dönen "pending" teslimat kaydı ({ token, items, ... })
 */
export default function DeliveryQRScreen({ delivery, onBack }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)

  const qrPayload = {
    type: 'medloop-delivery',
    token: delivery.token,
  }

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, JSON.stringify(qrPayload), {
      width: 256,
      margin: 1,
      color: { dark: '#0e2e20', light: '#ffffff' },
    }).catch(() => setError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          {error ? (
            <p className="text-sm text-rose-500 w-64 text-center">QR kod oluşturulamadı, geri dönüp tekrar dene.</p>
          ) : (
            <canvas ref={canvasRef} className="rounded-xl" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-forest-900">Bu QR kodu eczacıya göster</p>
          <p className="text-xs text-forest-700/60 mt-1">
            {delivery.items.length} ilaç · eczacı QR Tara ile onayladığında dolabından düşer ve puan kazanırsın.
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-400">
            Bekliyor
          </span>
        </div>

        <ul className="w-full flex flex-col gap-2">
          {delivery.items.map((m) => (
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
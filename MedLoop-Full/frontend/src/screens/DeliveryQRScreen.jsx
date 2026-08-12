import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Seçilen ilaçları JSON olarak kodlayıp gerçek bir QR kod üretir (qrcode
 * kütüphanesi). Eczacı tarafı bu QR'ı gerçek kamerayla (jsQR) okur —
 * bkz. QrScanScreen.jsx. Aynı tarayıcı oturumunda rol değiştirerek
 * (Profil > Çıkış Yap > Eczacı) uçtan uca test edilebilir.
 */
export default function DeliveryQRScreen({ medicines, citizenName, onBack }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)

  const payload = {
    type: 'medloop-delivery',
    citizenName,
    items: medicines.map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      form: m.form,
      quantity: m.quantity,
    })),
    generatedAt: new Date().toISOString(),
  }

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, JSON.stringify(payload), {
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
            {medicines.length} ilaç · eczacı QR Tara ile onayladığında dolabından düşer ve puan kazanırsın.
          </p>
        </div>

        <ul className="w-full flex flex-col gap-2">
          {medicines.map((m) => (
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
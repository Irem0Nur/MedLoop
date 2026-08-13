import { useEffect, useState } from 'react'

/**
 * @param {object} delivery - QrScanScreen'de doğrulanmış, gerçek "pending" teslimat kaydı
 * @param {() => void} onConfirm - vatandaşın dolabından düşürür, puan/sayaç günceller,
 *   teslimatı 'completed' durumuna geçirir
 * @param {() => void} onDone - onay ekranı birkaç saniye gösterildikten sonra çağrılır
 */
export default function DeliveryConfirmScreen({ delivery, onConfirm, onCancel, onDone }) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setConfirmed(true)
  }

  useEffect(() => {
    if (!confirmed) return
    const timer = setTimeout(() => onDone?.(), 1800)
    return () => clearTimeout(timer)
  }, [confirmed, onDone])

  if (confirmed) {
    return (
      <div className="app-shell flex flex-col items-center justify-center gap-4 px-10 text-center">
        <div className="w-20 h-20 rounded-full bg-forest-600 text-white flex items-center justify-center">
          <CheckIcon />
        </div>
        <div>
          <h1 className="font-display font-bold text-forest-900 text-xl">Teslimat Onaylandı</h1>
          <p className="text-sm text-forest-700/60 mt-2">
            {delivery.items.length} ilaç için {delivery.citizenName ?? 'vatandaşın'} hesabına puan eklendi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center gap-3 px-4 pt-5">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Vazgeç"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-forest-900 text-lg">Teslimatı Onayla</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-8 flex flex-col gap-5">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
            <PersonIcon />
          </span>
          <div>
            <p className="text-xs text-forest-700/60">Teslim eden</p>
            <p className="text-sm font-semibold text-forest-900">{delivery.citizenName ?? 'Bilinmeyen vatandaş'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Teslim Edilecek İlaçlar ({delivery.items.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {delivery.items.map((item) => (
              <li key={item.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-forest-900">{item.name}</p>
                  <p className="text-xs text-forest-700/60">{item.dosage} · {item.form}</p>
                </div>
                <span className="text-xs font-medium text-forest-700/70">{item.quantity} adet</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
        >
          Teslimi Onayla
        </button>
      </div>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
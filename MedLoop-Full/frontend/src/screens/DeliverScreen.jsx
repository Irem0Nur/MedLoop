import { useState } from 'react'

/**
 * @param {(selectedMedicines: object[]) => Promise<void>} onGenerateQr - backend'e
 *   POST /deliveries/request atıp QR ekranına geçer (App.jsx)
 */
export default function DeliverScreen({ medicines, onGenerateQr, onBack }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedMedicines = medicines.filter((m) => selectedIds.has(m.id))

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      await onGenerateQr(selectedMedicines)
    } catch (err) {
      setError(err?.message || 'QR oluşturulamadı, tekrar dene.')
      setLoading(false)
    }
  }

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
        <h1 className="font-display font-bold text-forest-900 text-lg">Teslim Et</h1>
      </header>

      <p className="relative z-10 px-5 mt-4 text-xs text-forest-700/60">
        Eczaneye teslim etmek istediğin ilaçları seç, ardından QR kod oluştur.
      </p>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-4 pb-28">
        {medicines.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Dolabın boş.</p>
            <p className="text-xs text-forest-700/60 mt-1">Teslim edebileceğin bir ilaç yok.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {medicines.map((m) => {
              const checked = selectedIds.has(m.id)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`w-full text-left glass-card rounded-2xl p-3 flex items-center gap-3 transition-transform active:scale-[0.98] ${
                      checked ? 'ring-2 ring-forest-500' : ''
                    }`}
                  >
                    {m.image ? (
                      <img src={m.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-mint-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-forest-900 truncate">{m.name}</p>
                      <p className="text-xs text-forest-700/60">
                        {m.dosage} · {m.form} · {m.quantity} adet
                      </p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        checked ? 'bg-forest-600 border-forest-600 text-white' : 'border-forest-900/20'
                      }`}
                    >
                      {checked && <CheckIcon />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selectedMedicines.length > 0 && (
        <div className="absolute bottom-0 inset-x-0 z-10 p-5">
          {error && <p className="text-xs text-rose-500 font-medium text-center mb-2">{error}</p>}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
          >
            <QrIcon /> {loading ? 'Oluşturuluyor…' : `${selectedMedicines.length} İlaç için QR Oluştur`}
          </button>
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M14 20h3M20 14v3M20 20v.01" />
    </svg>
  )
}

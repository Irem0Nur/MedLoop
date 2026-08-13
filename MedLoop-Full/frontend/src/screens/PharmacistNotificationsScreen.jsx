import { getStockGroups } from '../utils/pharmacyStock.js'

export default function PharmacistNotificationsScreen({ deliveries, onOpenDelivery, onOpenStock, onBack }) {
  const pending = deliveries.filter((d) => d.status === 'pending')
  const stockGroups = getStockGroups(deliveries)
  const critical = stockGroups.filter((g) => g.isCritical)
  const expiring = stockGroups.filter((g) => g.worstExpiryStatus !== 'safe')
  const recentCompleted = [...deliveries]
    .filter((d) => d.status === 'completed')
    .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
    .slice(0, 5)

  const isEmpty = pending.length === 0 && critical.length === 0 && expiring.length === 0 && recentCompleted.length === 0

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
        <h1 className="font-display font-bold text-forest-900 text-lg">Uyarılar</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-6">
        {isEmpty && (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Her şey yolunda.</p>
            <p className="text-xs text-forest-700/60 mt-1">Şu an aktif bir uyarı yok.</p>
          </div>
        )}

        {pending.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
              Bekleyen Teslimatlar ({pending.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {pending.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDelivery(d.id)}
                    className="w-full text-left glass-card rounded-xl p-3.5 flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-400 flex items-center justify-center shrink-0">
                      <ClockIcon />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-forest-900 truncate">
                        {d.citizenName ?? 'Vatandaş'} — {d.items.length} ilaç QR onayı bekliyor
                      </p>
                    </div>
                    <ChevronIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {critical.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
              Kritik Stok ({critical.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {critical.map((g) => (
                <li key={g.name}>
                  <button
                    type="button"
                    onClick={() => onOpenStock(g.name)}
                    className="w-full text-left glass-card rounded-xl p-3.5 flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                      <AlertIcon />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-forest-900 truncate">
                        {g.name} — {g.totalQuantity} adet, acil imha gerekiyor
                      </p>
                    </div>
                    <ChevronIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {expiring.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
              SKT Uyarıları ({expiring.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {expiring.map((g) => (
                <li key={g.name}>
                  <button
                    type="button"
                    onClick={() => onOpenStock(g.name)}
                    className="w-full text-left glass-card rounded-xl p-3.5 flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-400 flex items-center justify-center shrink-0">
                      <ClockIcon />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-forest-900 truncate">
                        {g.name} — son kullanma tarihi {g.worstExpiryStatus === 'expired' ? 'geçti' : 'yaklaşıyor'}
                      </p>
                    </div>
                    <ChevronIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentCompleted.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
              İşlem Bildirimleri
            </h2>
            <ul className="flex flex-col gap-2">
              {recentCompleted.map((d) => (
                <li key={d.id} className="glass-card rounded-xl p-3.5 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-sage-100 text-sage-400 flex items-center justify-center shrink-0">
                    <CheckIcon />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-900 truncate">
                      {d.citizenName ?? 'Vatandaş'} teslimatını onayladınız
                    </p>
                    <p className="text-[11px] text-forest-700/50">
                      {new Date(d.confirmedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
      <path d="M10.3 3.9 2.7 17a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700/30 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
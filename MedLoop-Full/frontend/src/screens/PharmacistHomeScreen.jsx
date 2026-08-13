import PharmacistBottomNav from '../components/PharmacistBottomNav.jsx'
import { getStockGroups } from '../utils/pharmacyStock.js'

/**
 * @param {Array} deliveries - gerçek teslimat listesi (status: 'pending' | 'completed')
 * @param {string} pharmacyName
 */
export default function PharmacistHomeScreen({ deliveries, pharmacyName, onScanQr, onOpenDelivery, onOpenNotifications, onOpenStats, onNavigate }) {
  const pending = deliveries.filter((d) => d.status === 'pending')
  const completed = deliveries.filter((d) => d.status === 'completed')
  const today = new Date().toDateString()
  const completedToday = completed.filter((d) => new Date(d.confirmedAt).toDateString() === today).length
  const totalDeliveredItems = completed.reduce((sum, d) => sum + d.items.length, 0)

  const stockGroups = getStockGroups(deliveries)
  const criticalCount = stockGroups.filter((g) => g.isCritical).length
  const expiryWarningCount = stockGroups.filter((g) => g.worstExpiryStatus !== 'safe').length
  const hasAlerts = pending.length > 0 || criticalCount > 0 || expiryWarningCount > 0

  const recent = [...deliveries].reverse().slice(0, 3)

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-forest-700/60">Merhaba,</p>
          <h1 className="font-display font-bold text-forest-900 text-xl">{pharmacyName}</h1>
        </div>
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Uyarılar"
          className="relative w-11 h-11 rounded-full glass-card flex items-center justify-center text-forest-700"
        >
          <BellIcon />
          {hasAlerts && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto pb-28">
        <section className="px-5 mt-5">
          <div className="glass-card rounded-3xl p-5">
            <p className="text-[11px] font-semibold text-forest-700/60 uppercase tracking-wide">
              Teslim Alım Özeti
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <StatBox value={pending.length} label="Bekleyen" />
              <StatBox value={completedToday} label="Bugün" />
              <StatBox value={totalDeliveredItems} label="Toplam İlaç" />
            </div>
          </div>
        </section>

        {(criticalCount > 0 || expiryWarningCount > 0) && (
          <section className="px-5 mt-3 flex flex-col gap-2">
            {criticalCount > 0 && (
              <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertIcon />
                </span>
                <p className="text-xs text-forest-900">
                  <span className="font-semibold">{criticalCount} ilaç</span> kritik stokta — acil imha gerekiyor.
                </p>
              </div>
            )}
            {expiryWarningCount > 0 && (
              <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-400 flex items-center justify-center shrink-0">
                  <ClockIcon />
                </span>
                <p className="text-xs text-forest-900">
                  <span className="font-semibold">{expiryWarningCount} ilaç</span> için SKT yaklaşıyor/geçti.
                </p>
              </div>
            )}
          </section>
        )}

        <div className="px-5 mt-5">
          <button
            type="button"
            onClick={onScanQr}
            className="w-full h-16 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
          >
            <QrIcon /> QR Doğrula
          </button>
        </div>

        <div className="px-5 mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('stock')}
            className="glass-card rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-forest-700"
          >
            <StockIcon /> Stok Yönetimi
          </button>
          <button
            type="button"
            onClick={onOpenStats}
            className="glass-card rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-forest-700"
          >
            <ChartIcon /> İstatistikler
          </button>
        </div>

        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide">
              Son Teslimatlar
            </h2>
            {deliveries.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.('history')}
                className="text-xs font-semibold text-forest-600"
              >
                Tümünü Gör
              </button>
            )}
          </div>

          {deliveries.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-sm text-forest-900 font-medium">Henüz teslimat yok.</p>
              <p className="text-xs text-forest-700/60 mt-1">
                Bir vatandaşın QR kodunu okutarak teslimat onaylayabilirsin.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDelivery(d.id)}
                    className="w-full text-left glass-card rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-forest-900">{d.citizenName ?? 'Vatandaş'}</p>
                      <span
                        className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          d.status === 'pending' ? 'bg-amber-100 text-amber-400' : 'bg-sage-100 text-sage-400'
                        }`}
                      >
                        {d.status === 'pending' ? 'Bekliyor' : 'Tamamlandı'}
                      </span>
                    </div>
                    <p className="text-xs text-forest-700/60 mt-1">
                      {d.items.map((i) => i.name).join(', ')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <PharmacistBottomNav active="home" onNavigate={onNavigate} />
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-xl">{value}</p>
      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function QrIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M14 20h3M20 14v3M20 20v.01" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
      <path d="M10.3 3.9 2.7 17a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}
function StockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  )
}
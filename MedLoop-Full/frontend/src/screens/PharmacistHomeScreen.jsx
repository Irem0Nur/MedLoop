import PharmacistBottomNav from '../components/PharmacistBottomNav.jsx'

/**
 * @param {Array<{id, citizenName, items, confirmedAt}>} deliveries - bu oturumda onaylanan teslimatlar
 * @param {string} pharmacyName
 */
export default function PharmacistHomeScreen({ deliveries, pharmacyName, onScanQr, onOpenDelivery, onNavigate }) {
  const totalMedicines = deliveries.reduce((sum, d) => sum + d.items.length, 0)
  const today = new Date().toDateString()
  const todayCount = deliveries.filter((d) => new Date(d.confirmedAt).toDateString() === today).length
  const recent = [...deliveries].reverse().slice(0, 3)

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <p className="text-sm text-forest-700/60">Merhaba,</p>
        <h1 className="font-display font-bold text-forest-900 text-xl">{pharmacyName}</h1>
      </header>

      <section className="relative z-10 px-5 mt-5">
        <div className="glass-card rounded-3xl p-5">
          <p className="text-[11px] font-semibold text-forest-700/60 uppercase tracking-wide">
            Teslim Alım Özeti
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatBox value={todayCount} label="Bugün" />
            <StatBox value={deliveries.length} label="Toplam Teslimat" />
            <StatBox value={totalMedicines} label="Toplam İlaç" />
          </div>
        </div>
      </section>

      <div className="relative z-10 px-5 mt-5">
        <button
          type="button"
          onClick={onScanQr}
          className="w-full h-16 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
        >
          <QrIcon /> QR Doğrula
        </button>
      </div>

      <section className="relative z-10 flex-1 overflow-y-auto px-5 mt-8 pb-28">
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-forest-900">{d.citizenName ?? 'Vatandaş'}</p>
                    <span className="text-xs text-forest-700/50">
                      {new Date(d.confirmedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
import { useMemo, useState } from 'react'
import PharmacistBottomNav from '../components/PharmacistBottomNav.jsx'

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'confirmed', label: 'Tamamlanan' },
]

export default function PharmacistHistoryScreen({ deliveries, onOpenDelivery, onNavigate }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    return [...deliveries]
      .reverse()
      .filter((d) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        const inName = (d.citizenName ?? '').toLowerCase().includes(q)
        const inItems = d.items.some((i) => i.name.toLowerCase().includes(q))
        return inName || inItems
      })
      .filter((d) => filter === 'all' || d.status === filter)
  }, [deliveries, query, filter])

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Teslimatlar</h1>
        <p className="text-sm text-forest-700/60 mt-0.5">{deliveries.length} kayıt</p>
      </header>

      <div className="relative z-10 px-5 mt-4">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/40">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vatandaş veya ilaç adı ara..."
            className="w-full h-12 rounded-xl pl-10 pr-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 mt-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-forest-600 text-white' : 'bg-white/70 text-forest-700/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="relative z-10 flex-1 overflow-y-auto px-5 mt-4 pb-28">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">
              {deliveries.length === 0 ? 'Henüz teslimat yok.' : 'Bu filtreye uyan teslimat yok.'}
            </p>
            <p className="text-xs text-forest-700/60 mt-1">
              {deliveries.length === 0
                ? 'Bir vatandaşın QR kodunu okutarak teslimat onaylayabilirsin.'
                : 'Arama veya filtreyi değiştirmeyi dene.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onOpenDelivery(d.id)}
                  className="w-full text-left glass-card rounded-2xl p-4 flex items-center gap-3"
                >
                  <span className="w-11 h-11 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                    <PersonIcon />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-forest-900 truncate">{d.citizenName ?? 'Vatandaş'}</p>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          d.status === 'pending' ? 'bg-amber-100 text-amber-400' : 'bg-sage-100 text-sage-400'
                        }`}
                      >
                        {d.status === 'pending' ? 'Bekliyor' : 'Tamamlandı'}
                      </span>
                    </div>
                    <p className="text-xs text-forest-700/60 truncate">{d.items.map((i) => i.name).join(', ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-forest-700/70">{d.items.length} ilaç</p>
                    <p className="text-[11px] text-forest-700/50">
                      {new Date(d.confirmedAt ?? d.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <ChevronIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PharmacistBottomNav active="history" onNavigate={onNavigate} />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
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
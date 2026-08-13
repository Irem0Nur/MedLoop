import { useMemo, useState } from 'react'
import PharmacistBottomNav from '../components/PharmacistBottomNav.jsx'
import { getStockGroups, getDisposedGroups, mockBarcode } from '../utils/pharmacyStock.js'

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'critical', label: 'Kritik Stok' },
  { key: 'expiry', label: 'SKT Yaklaşan' },
  { key: 'disposed', label: 'İmha Edilenler' },
]

export default function PharmacistStockScreen({ deliveries, onOpenStock, onNavigate }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const activeGroups = useMemo(() => getStockGroups(deliveries), [deliveries])
  const disposedGroups = useMemo(() => getDisposedGroups(deliveries), [deliveries])

  const list = filter === 'disposed' ? disposedGroups : activeGroups

  const filtered = useMemo(() => {
    return list
      .filter((g) => {
        if (filter === 'critical') return g.isCritical
        if (filter === 'expiry') return g.worstExpiryStatus !== 'safe'
        return true
      })
      .filter((g) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return g.name.toLowerCase().includes(q) || mockBarcode(g.name).includes(q)
      })
  }, [list, filter, query])

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Stok Yönetimi</h1>
        <p className="text-sm text-forest-700/60 mt-0.5">
          {filter === 'disposed' ? `${disposedGroups.length} imha edilen kalem` : `${activeGroups.length} ilaç çeşidi`}
        </p>
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
            placeholder="İlaç adı veya barkod ara..."
            className="w-full h-12 rounded-xl pl-10 pr-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
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
              {list.length === 0 ? 'Bu kategoride ilaç yok.' : 'Bu filtreye uyan ilaç yok.'}
            </p>
            <p className="text-xs text-forest-700/60 mt-1">
              {filter === 'disposed'
                ? 'Henüz imhaya gönderilmiş bir ilaç yok.'
                : 'Teslimatlar onaylandıkça burada birikir.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((g) => (
              <li key={g.name}>
                <button
                  type="button"
                  onClick={() => onOpenStock(g.name, filter === 'disposed')}
                  className="w-full text-left glass-card rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-forest-900 truncate">{g.name}</p>
                      {g.isCritical && filter !== 'disposed' && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500">
                          Kritik
                        </span>
                      )}
                      {g.worstExpiryStatus !== 'safe' && filter !== 'disposed' && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-400">
                          SKT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-forest-700/60 mt-0.5">{g.dosage} · {g.form}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-forest-900">{g.totalQuantity}</p>
                    <p className="text-[10px] text-forest-700/50">adet</p>
                  </div>
                  <ChevronIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PharmacistBottomNav active="stock" onNavigate={onNavigate} />
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
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700/30 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
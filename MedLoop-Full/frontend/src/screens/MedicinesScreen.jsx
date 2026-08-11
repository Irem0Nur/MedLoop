import { useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { getExpiryStatus } from '../utils/expiry.js'

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'soon', label: 'Yaklaşan SKT' },
  { key: 'expired', label: 'Süresi Geçmiş' },
]

export default function MedicinesScreen({ medicines, onOpenMedicine, onNavigate }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const counts = useMemo(() => {
    const result = { soon: 0, expired: 0 }
    medicines.forEach((m) => {
      const status = getExpiryStatus(m.expiryDate).key
      if (status === 'soon') result.soon += 1
      if (status === 'expired') result.expired += 1
    })
    return result
  }, [medicines])

  const filtered = useMemo(() => {
    return medicines
      .filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((m) => {
        if (filter === 'all') return true
        return getExpiryStatus(m.expiryDate).key === filter
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  }, [medicines, query, filter])

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">İlaçlarım</h1>
        <p className="text-sm text-forest-700/60 mt-0.5">
          {medicines.length} ilaç · {counts.soon} yaklaşan · {counts.expired} süresi geçmiş
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
            placeholder="İlaç adı ara..."
            className="w-full h-12 rounded-xl pl-10 pr-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-forest-600 text-white'
                  : 'bg-white/70 text-forest-700/70'
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
              {medicines.length === 0 ? 'Dolabın henüz boş.' : 'Bu filtreye uyan ilaç yok.'}
            </p>
            <p className="text-xs text-forest-700/60 mt-1">
              {medicines.length === 0
                ? 'İlk ilacını eklemek için "Tara"ya dokun.'
                : 'Arama veya filtreyi değiştirmeyi dene.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((m) => {
              const status = getExpiryStatus(m.expiryDate)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onOpenMedicine?.(m)}
                    className="w-full text-left glass-card rounded-2xl p-3 flex items-center gap-3"
                  >
                    {m.image ? (
                      <img src={m.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-mint-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-forest-900 truncate">{m.name}</p>
                      <p className="text-xs text-forest-700/60 mt-0.5">
                        {m.dosage} · {m.form} · {m.quantity} adet
                      </p>
                      <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </div>
                    <ChevronIcon />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <BottomNav active="medicines" onNavigate={onNavigate} />
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
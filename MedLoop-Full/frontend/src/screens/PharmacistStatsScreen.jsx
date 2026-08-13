import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { getStockGroups, getDisposedGroups } from '../utils/pharmacyStock.js'

const RANGES = [
  { key: 'daily', label: 'Günlük', days: 7 },
  { key: 'weekly', label: 'Haftalık', days: 28 },
  { key: 'monthly', label: 'Aylık', days: 180 },
]

export default function PharmacistStatsScreen({ deliveries, onBack }) {
  const [range, setRange] = useState('daily')
  const completed = useMemo(() => deliveries.filter((d) => d.status === 'completed'), [deliveries])

  const chartData = useMemo(() => buildChartData(completed, range), [completed, range])

  const topMedicines = useMemo(() => {
    const active = getStockGroups(deliveries)
    const disposed = getDisposedGroups(deliveries)
    const combined = new Map()
    ;[...active, ...disposed].forEach((g) => {
      const key = g.name.toLowerCase()
      combined.set(key, (combined.get(key) ?? 0) + g.totalQuantity)
    })
    return Array.from(combined.entries())
      .map(([key, total]) => ({ name: active.find((g) => g.name.toLowerCase() === key)?.name ?? disposed.find((g) => g.name.toLowerCase() === key)?.name ?? key, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [deliveries])

  const maxTop = topMedicines[0]?.total || 1

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
        <h1 className="font-display font-bold text-forest-900 text-lg">İstatistikler</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-6">
        <section>
          <div className="flex gap-2 mb-4">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  range === r.key ? 'bg-forest-600 text-white' : 'bg-white/70 text-forest-700/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
              Teslimat Sayısı
            </p>
            {chartData.every((d) => d.count === 0) ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-forest-700/50">Bu aralıkta teslimat yok.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,46,32,0.08)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'rgba(14,46,32,0.5)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(14,46,32,0.5)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(30,107,76,0.08)' }}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(14,46,32,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#1e6b4c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            En Çok Teslim Edilen İlaçlar
          </p>
          {topMedicines.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-sm text-forest-700/60">Henüz veri yok.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
              {topMedicines.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-forest-700/40 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-forest-900 truncate">{m.name}</p>
                      <span className="text-xs font-semibold text-forest-700/60 shrink-0">{m.total} adet</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-mint-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest-600"
                        style={{ width: `${(m.total / maxTop) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/** Tamamlanan teslimatları seçili aralığa göre günlük bar-chart verisine dönüştürür. */
function buildChartData(completed, rangeKey) {
  const bucketCount = rangeKey === 'monthly' ? 6 : rangeKey === 'weekly' ? 4 : 7
  const bucketDays = rangeKey === 'monthly' ? 30 : rangeKey === 'weekly' ? 7 : 1

  const now = new Date()
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const end = new Date(now)
    end.setDate(end.getDate() - i * bucketDays)
    const start = new Date(end)
    start.setDate(start.getDate() - bucketDays + 1)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end, count: 0 }
  }).reverse()

  completed.forEach((d) => {
    const confirmedAt = new Date(d.confirmedAt)
    const bucket = buckets.find((b) => confirmedAt >= b.start && confirmedAt <= b.end)
    if (bucket) bucket.count += 1
  })

  return buckets.map((b) => ({
    label:
      rangeKey === 'monthly'
        ? b.start.toLocaleDateString('tr-TR', { month: 'short' })
        : rangeKey === 'weekly'
          ? `${b.start.getDate()}/${b.start.getMonth() + 1}`
          : b.start.toLocaleDateString('tr-TR', { weekday: 'short' }),
    count: b.count,
  }))
}
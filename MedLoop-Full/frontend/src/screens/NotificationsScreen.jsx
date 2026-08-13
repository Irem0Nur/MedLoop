import { useMemo } from 'react'
import BottomNav from '../components/BottomNav.jsx'

const BADGE = {
  expiry_warning_today: { label: 'Acil', className: 'bg-rose-100 text-rose-500', dot: 'bg-rose-500' },
  expiry_warning_week: { label: 'Yaklaşıyor', className: 'bg-amber-100 text-amber-400', dot: 'bg-amber-400' },
  medication_added: { label: 'Eklendi', className: 'bg-forest-100 text-forest-700', dot: 'bg-forest-500' },
  delivered: { label: 'Teslim Edildi', className: 'bg-forest-100 text-forest-700', dot: 'bg-forest-600' },
}
const DEFAULT_BADGE = { label: 'Bildirim', className: 'bg-forest-100 text-forest-700', dot: 'bg-forest-500' }

/**
 * Bildirimler backend'den (GET /notifications) gerçek zamanlı gelir —
 * SKT uyarıları, "ilaç eklendi" ve "teslim edildi + puan" bildirimlerinin
 * hepsi burada listelenir (en yeni en üstte).
 *
 * @param {object[]} notifications - Notification.to_dict() listesi
 * @param {boolean} loading
 * @param {(id: number) => void} onMarkRead
 * @param {{ soonEnabled: boolean, expiredEnabled: boolean }} prefs - Profil >
 *   Bildirim Ayarları'ndaki tercihler; SKT uyarı kategorileri burada filtrelenir
 *   (ilaç eklendi / teslim edildi bildirimleri her zaman görünür).
 */
export default function NotificationsScreen({ notifications, loading, onMarkRead, onNavigate, prefs }) {
  const filtered = useMemo(() => {
    return (notifications ?? []).filter((n) => {
      if (n.type === 'expiry_warning_week' && prefs && !prefs.soonEnabled) return false
      if (n.type === 'expiry_warning_today' && prefs && !prefs.expiredEnabled) return false
      return true
    })
  }, [notifications, prefs])

  const unreadCount = filtered.filter((n) => !n.isRead).length

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Bildirimler</h1>
        <p className="text-sm text-forest-700/60 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
        </p>
      </header>

      <section className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-28">
        {loading ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Yükleniyor…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Şu an bildirim yok.</p>
            <p className="text-xs text-forest-700/60 mt-1">
              Son kullanma tarihi yaklaşan/geçmiş ilaçlar ve teslimat bildirimleri burada görünür.
            </p>
          </div>
        ) : (
          <ol className="relative flex flex-col gap-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest-900/10" aria-hidden="true" />
            {filtered.map((n) => {
              const badge = BADGE[n.type] ?? DEFAULT_BADGE
              const isRead = n.isRead
              return (
                <li key={n.id} className="relative pl-7">
                  <span
                    className={`absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-mint-50 ${badge.dot}`}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => !isRead && onMarkRead?.(n.id)}
                    className={`w-full text-left glass-card rounded-2xl p-4 transition-opacity ${
                      isRead ? 'opacity-55' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold text-forest-900">{n.title}</h2>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-forest-700/70 mt-1.5 leading-relaxed">{n.message}</p>
                    {!isRead && (
                      <span className="inline-block mt-2 text-[11px] font-medium text-forest-600">
                        Okundu işaretlemek için dokun
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <BottomNav active="notifications" onNavigate={onNavigate} />
    </div>
  )
}

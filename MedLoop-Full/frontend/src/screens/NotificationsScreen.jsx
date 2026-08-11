import { useMemo } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { getExpiryStatus } from '../utils/expiry.js'

/**
 * Bildirimler, kayıtlı ilaçların son kullanma tarihi durumundan canlı olarak
 * türetilir (statik/mock içerik yok). Süresi geçmiş ilaçlar "Acil", 30 gün
 * içindekiler "Yaklaşıyor" rozetiyle listelenir.
 *
 * @param {Set<string>} readIds - okundu işaretlenmiş bildirim id'leri (=ilaç id'si)
 * @param {(id: string) => void} onMarkRead
 */
export default function NotificationsScreen({ medicines, readIds, onMarkRead, onNavigate }) {
  const notifications = useMemo(() => {
    return medicines
      .map((m) => {
        const status = getExpiryStatus(m.expiryDate)
        if (status.key !== 'expired' && status.key !== 'soon') return null
        return {
          id: m.id,
          medicineName: m.name,
          dosage: m.dosage,
          urgent: status.key === 'expired',
          badgeLabel: status.key === 'expired' ? 'Acil' : 'Yaklaşıyor',
          title: status.key === 'expired' ? `${m.name} Süresi Doldu` : `${m.name} Yaklaşıyor`,
          body:
            status.key === 'expired'
              ? `${m.name} ${m.dosage} ilacınızın son kullanma tarihi geçti. Güvenli imhaya gönderin.`
              : `${m.name} ${m.dosage} için son kullanma tarihine ${status.daysLeft} gün kaldı.`,
          daysLeft: status.daysLeft,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [medicines])

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Bildirimler</h1>
        <p className="text-sm text-forest-700/60 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
        </p>
      </header>

      <section className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-28">
        {notifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Şu an bildirim yok.</p>
            <p className="text-xs text-forest-700/60 mt-1">
              Son kullanma tarihi yaklaşan ya da geçmiş ilaçların burada görünür.
            </p>
          </div>
        ) : (
          <ol className="relative flex flex-col gap-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest-900/10" aria-hidden="true" />
            {notifications.map((n) => {
              const isRead = readIds.has(n.id)
              return (
                <li key={n.id} className="relative pl-7">
                  <span
                    className={`absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-mint-50 ${
                      n.urgent ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => onMarkRead?.(n.id)}
                    className={`w-full text-left glass-card rounded-2xl p-4 transition-opacity ${
                      isRead ? 'opacity-55' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold text-forest-900">{n.title}</h2>
                      <span
                        className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          n.urgent ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-400'
                        }`}
                      >
                        {n.badgeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-forest-700/70 mt-1.5 leading-relaxed">{n.body}</p>
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
import BottomNav from '../components/BottomNav.jsx'
import NearbyPharmacies from '../components/NearbyPharmacies.jsx'
import { getExpiryStatus } from '../utils/expiry.js'

const QUICK_ACCESS = [
  { key: 'medicines', label: 'İlaçlarım', icon: <PillIcon /> },
  { key: 'deliver', label: 'Teslim Et', icon: <BagIcon /> },
  { key: 'notifications', label: 'Bildirimler', icon: <BellIcon /> },
  { key: 'achievements', label: 'Başarılarım', icon: <PersonIcon /> },
]

/**
 * @param {number} points - gerçek MedLoop puanı (App.jsx'te ilaç ekledikçe artar)
 * @param {number} unreadCount - okunmamış bildirim sayısı (zil rozetinde gösterilir)
 * @param {{totalDeliveries: number, co2SavedKg: number, waterSavedLiters: number}} [impact] -
 *   backend'deki GET /users/me/impact'ten gelen, güvenle teslim edilen ilaçların
 *   tahmini çevresel etkisi (bkz. "Çevresel Etkin" kartı).
 * @param {(key: string) => void} onQuickAccess - Hızlı Erişim kartlarından birine dokunulunca
 */
export default function HomeScreen({ name, medicines, points, unreadCount, impact, onScan, onNavigate, onQuickAccess }) {
  const soonCount = medicines.filter((m) => getExpiryStatus(m.expiryDate).key === 'soon').length

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-forest-700/60">Merhaba,</p>
          <h1 className="font-display font-bold text-forest-900 text-xl">{name || 'Kullanıcı'}</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('notifications')}
          aria-label="Bildirimler"
          className="relative w-11 h-11 rounded-full glass-card flex items-center justify-center text-forest-700"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto pb-28">
        <section className="px-5 mt-5">
          <div className="glass-card rounded-3xl p-5">
            <p className="text-[11px] font-semibold text-forest-700/60 uppercase tracking-wide">
              Dijital İlaç Dolabım
            </p>
            <p className="font-display font-bold text-forest-900 text-lg mt-0.5">Genel Bakış</p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <StatBox value={medicines.length} label="Toplam İlaç" />
              <StatBox value={soonCount} label="Yaklaşan SKT" sub="Bu ay" />
              <StatBox value={points} label="MedLoop Puanı" />
            </div>
          </div>
        </section>

        <div className="px-5 mt-5">
          <button
            type="button"
            onClick={onScan}
            className="w-full h-16 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
          >
            <ScanIcon /> İlaç Tara
          </button>
        </div>

        <section className="px-5 mt-5">
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center gap-1.5">
              <span className="text-forest-700"><LeafIcon /></span>
              <p className="text-[11px] font-semibold text-forest-700/60 uppercase tracking-wide">
                Çevresel Etkin
              </p>
            </div>
            <p className="font-display font-bold text-forest-900 text-lg mt-0.5">
              {impact?.totalDeliveries > 0
                ? `${impact.totalDeliveries} güvenli teslimat`
                : 'İlk teslimatını bekliyoruz'}
            </p>
            {impact?.totalDeliveries > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <StatBox value={`${impact.co2SavedKg} kg`} label="CO2 Tasarrufu" />
                <StatBox value={`${impact.waterSavedLiters} L`} label="Su Koruması" />
              </div>
            ) : (
              <p className="text-xs text-forest-700/60 mt-2">
                İlaçlarını eczaneye güvenle teslim ettikçe tahmini CO2 ve su tasarrufun burada birikecek.
              </p>
            )}
          </div>
        </section>

        <section className="px-5 mt-8">
          <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Hızlı Erişim
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACCESS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onQuickAccess?.(item.key)}
                className="glass-card rounded-2xl py-4 flex flex-col items-center gap-2"
              >
                <span className="text-forest-700">{item.icon}</span>
                <span className="text-[11px] font-medium text-forest-700/70 text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <NearbyPharmacies />
      </div>

      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  )
}

function StatBox({ value, label, sub }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-xl">{value}</p>
      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">{label}</p>
      {sub && <p className="text-[9px] text-forest-700/40">{sub}</p>}
    </div>
  )
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
    </svg>
  )
}
function PillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" />
      <path d="M9.5 9.5 14.5 14.5" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
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
function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13V7a1 1 0 0 1 1-1h6a7 7 0 0 1 7 7 7 7 0 0 1-7 7Z" />
      <path d="M11 20v-9" />
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
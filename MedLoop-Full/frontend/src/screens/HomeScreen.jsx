import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import NearbyPharmacies from '../components/NearbyPharmacies.jsx'
import { getExpiryStatus } from '../utils/expiry.js'

const QUICK_ACCESS = [
  { key: 'medicines', label: 'İlaçlarım', icon: <PillIcon /> },
  { key: 'deliver', label: 'Teslim Et', icon: <BagIcon /> },
  { key: 'notifications', label: 'Bildirimler', icon: <BellIcon /> },
  { key: 'achievements', label: 'Başarılarım', icon: <PersonIcon /> },
]

const ECO_SLOGANS = [
  {
    icon: '♻️',
    text: 'Atığını ayır, geleceğini koru.',
  },
  {
    icon: '🌱',
    text: 'Bugün geri dönüştür, yarını güzelleştir.',
  },
  {
    icon: '🌍',
    text: 'Daha az atık, daha temiz bir dünya.',
  },
  {
    icon: '🔄',
    text: 'Dönüşüm küçük bir adımla başlar.',
  },
  {
    icon: '💚',
    text: 'Çöpe değil, dönüşüme kazandır.',
  },
  {
    icon: '🌿',
    text: 'Doğaya bıraktığın iz, güzel bir iz olsun.',
  },
  {
    icon: '♻️',
    text: 'Kullan, ayır, dönüştür, yeniden değerlendir.',
  },
  {
    icon: '🌎',
    text: 'Gelecek, bugün attığın doğru adımlarla şekillenir.',
  },
  {
    icon: '🌱',
    text: 'Her dönüşüm, doğa için bir nefes.',
  },
  {
    icon: '🔄',
    text: 'Atıkların sonu çöp olmak zorunda değil.',
  },
  {
    icon: '♻️',
    text: 'Dönüşüm sende başlar.',
  },
  {
    icon: '🌱',
    text: 'Doğa için bir adım daha.',
  },
  {
    icon: '🌍',
    text: 'Bugünün atığı, yarının kaynağı.',
  },
  {
    icon: '🔄',
    text: 'Daha az atık. Daha çok gelecek.',
  },
  {
    icon: '💚',
    text: 'Doğayı korumak, doğru seçimlerle başlar.',
  },
  {
    icon: '♻️',
    text: 'Çöpe atma, yeniden kazandır.',
  },
  {
    icon: '🌿',
    text: 'Döngüyü sen başlat.',
  },
  {
    icon: '🌎',
    text: 'Geleceği tüketme, dönüştür.',
  },
  {
    icon: '♻️',
    text: 'Her parça yeniden değer kazanabilir.',
  },
  {
    icon: '🌱',
    text: 'Biriktirme, dönüştür.',
  },
]

/**
 * @param {number} points - gerçek MedLoop puanı
 * @param {number} unreadCount - okunmamış bildirim sayısı
 * @param {() => void} onScan - İlaç Tara butonuna basıldığında
 * @param {(key: string) => void} onNavigate - sayfa navigasyonu
 * @param {(key: string) => void} onQuickAccess - Hızlı Erişim kartları
 */
export default function HomeScreen({
  medicines,
  userName,
  points,
  unreadCount,
  onScan,
  onNavigate,
  onQuickAccess,
}) {
  const soonCount = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate).key === 'soon'
  ).length

  return (
    <div className="app-shell flex flex-col">
      {/* HEADER */}
      <header className="relative z-10 px-5 pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-forest-700/60">Merhaba,</p>

          <h1 className="font-display font-bold text-forest-900 text-xl">
            {userName || 'MedLoop'}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.('notifications')}
          aria-label="Bildirimler"
          className="relative w-11 h-11 rounded-full glass-card flex items-center justify-center text-forest-700"
        >
          <BellIcon />

          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500"
              aria-hidden="true"
            />
          )}
        </button>
      </header>

      {/* GENEL BAKIŞ */}
      <section className="relative z-10 px-5 mt-5">
        <div className="glass-card rounded-3xl p-5">
          <p className="text-[11px] font-semibold text-forest-700/60 uppercase tracking-wide">
            Dijital İlaç Dolabım
          </p>

          <p className="font-display font-bold text-forest-900 text-lg mt-0.5">
            Genel Bakış
          </p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatBox
              value={medicines.length}
              label="Toplam İlaç"
            />

            <StatBox
              value={soonCount}
              label="Yaklaşan SKT"
              sub="Bu ay"
            />

            <StatBox
              value={points}
              label="MedLoop Puanı"
            />
          </div>
        </div>
      </section>

      {/* İLAÇ TARA */}
      <div className="relative z-10 px-5 mt-5">
        <button
          type="button"
          onClick={onScan}
          className="w-full h-16 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
        >
          <ScanIcon />

          İlaç Tara
        </button>
      </div>

      {/* HIZLI ERİŞİM */}
      <section className="relative z-10 px-5 mt-8">
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
              <span className="text-forest-700">
                {item.icon}
              </span>

              <span className="text-[11px] font-medium text-forest-700/70 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* GERİ DÖNÜŞÜM / SÜRDÜRÜLEBİLİRLİK SLOGANLARI */}
      <EcoSloganCarousel />

      {/* YAKINDAKİ ECZANELER */}
      <div className="flex-1 overflow-y-auto pb-28">
        <NearbyPharmacies />
      </div>

      {/* ALT NAVİGASYON */}
      <BottomNav
        active="home"
        onNavigate={onNavigate}
      />
    </div>
  )
}

/* =========================================================
   GERİ DÖNÜŞÜM SLOGAN CAROUSEL
   ========================================================= */

function EcoSloganCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) =>
        current === ECO_SLOGANS.length - 1 ? 0 : current + 1
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const activeSlogan = ECO_SLOGANS[activeIndex]

  return (
    <section className="relative z-10 px-5 mt-6">
      <div className="glass-card rounded-3xl p-5 overflow-hidden">

        {/* SADECE SLOGAN */}
        <div
          key={activeIndex}
          className="min-h-[70px] flex items-center justify-center text-center animate-fade-in"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">
              {activeSlogan.icon}
            </span>

            <p className="font-display font-semibold text-forest-900 text-[15px] leading-relaxed px-2">
              {activeSlogan.text}
            </p>
          </div>
        </div>

        {/* GEÇİŞ NOKTALARI */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {ECO_SLOGANS.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${index + 1}. sürdürülebilirlik sözü`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-5 bg-forest-600'
                  : 'w-1.5 bg-forest-700/20'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

/* =========================================================
   İSTATİSTİK KUTUSU
   ========================================================= */

function StatBox({ value, label, sub }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-xl">
        {value}
      </p>

      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">
        {label}
      </p>

      {sub && (
        <p className="text-[9px] text-forest-700/40">
          {sub}
        </p>
      )}
    </div>
  )
}

/* =========================================================
   SCAN ICON
   ========================================================= */

function ScanIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
    </svg>
  )
}

/* =========================================================
   PILL ICON
   ========================================================= */

function PillIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="9"
        width="18"
        height="6"
        rx="3"
        transform="rotate(-35 12 12)"
      />

      <path d="M9.5 9.5 14.5 14.5" />
    </svg>
  )
}

/* =========================================================
   BAG ICON
   ========================================================= */

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

/* =========================================================
   BELL ICON
   ========================================================= */

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />

      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

/* =========================================================
   PERSON ICON
   ========================================================= */

function PersonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
import { useRef, useState } from 'react'
import Logo from '../components/Logo.jsx'
import FeatureIconCard from '../components/FeatureIconCard.jsx'

const SLIDES = [
  {
    title: 'İlaçlarını Dijitalleştir',
    body: 'İlaçlarını tek uygulamada güvenle yönet.',
    icon: <DigitizeIcon />,
  },
  {
    title: 'Son Kullanma Tarihini Takip Et',
    body: 'Hiçbir tarihi kaçırma.',
    icon: <ExpiryIcon />,
  },
  {
    title: 'Güvenli Teslim Et',
    body: 'İlaçlarını güvenle geri kazandır.',
    icon: <DeliverIcon />,
  },
  {
    title: 'Başarı Kazan',
    body: 'Doğru alışkanlıklar oluştur.',
    icon: <AchievementIcon />,
  },
]

export default function OnboardingScreen({ onComplete }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)
  const isLast = index === SLIDES.length - 1

  const goTo = (i) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)))

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -40) goTo(index + 1)
    else if (delta > 40) goTo(index - 1)
    touchStartX.current = null
  }

  const slide = SLIDES[index]

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <Logo size={40} />
        {!isLast && (
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 rounded-full bg-white/70 text-forest-700 text-sm font-medium"
          >
            Atla
          </button>
        )}
      </header>

      <div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FeatureIconCard>{slide.icon}</FeatureIconCard>
        <div className="text-center">
          <h1 className="font-display font-bold text-forest-900 text-2xl leading-snug">
            {slide.title}
          </h1>
          <p className="text-forest-700/60 text-sm mt-2">{slide.body}</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}. slayta git`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-forest-600' : 'w-2 bg-forest-600/25'
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 px-5 pb-8">
        <button
          type="button"
          onClick={() => (isLast ? onComplete?.() : goTo(index + 1))}
          className="w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
        >
          {isLast ? 'Başlayalım' : 'İleri'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function DigitizeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="#1e6b4c" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9h6M9 12.5h6M9 16h3.5" stroke="#1e6b4c" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="16" r="3.4" fill="#cf9b3f" />
      <path d="M17 14.6v2.8M15.6 16h2.8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function ExpiryIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="6" width="8" height="14" rx="2" fill="#a9d9bc" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" stroke="#1e6b4c" strokeWidth="1.6" />
      <path d="M10 10h4M10 13h4" stroke="#17573f" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="18" cy="7" r="2.6" fill="#cf9b3f" />
      <path d="M4 17h5M4 17l2-2M4 17l2 2" stroke="#cf9b3f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DeliverIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="8" height="8" rx="1.2" stroke="#1e6b4c" strokeWidth="1.6" />
      <path d="M6.5 7.5h3M6.5 9h1.5M6.5 10.5h3" stroke="#1e6b4c" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="14" y="5" width="6" height="8" rx="1.2" fill="#2d7d59" />
      <path d="M16.2 9h1.6M17 8.2v1.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="4.5" r="2.8" fill="white" stroke="#cf9b3f" strokeWidth="1.4" />
      <path d="M15.8 4.5l.9.9 1.6-1.7" stroke="#cf9b3f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function AchievementIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="13" r="5" fill="#cbd5cf" />
      <circle cx="15" cy="13" r="5.6" fill="#cf9b3f" />
      <path d="M15 10.6l.9 1.8 2 .3-1.45 1.4.34 2-1.79-.95-1.79.95.34-2L12.1 12.7l2-.3.9-1.8Z" fill="white" />
      <rect x="13.4" y="4" width="3.2" height="4.4" fill="#8a6a2c" />
    </svg>
  )
}
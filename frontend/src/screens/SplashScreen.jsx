import { useEffect } from 'react'

/**
 * Uygulama açılışında ~1.6sn gösterilen marka ekranı.
 * Süre dolunca otomatik olarak onboarding'e geçer; kullanıcı dokunursa
 * beklemeden hemen geçebilir.
 */
export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), 1600)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <button
      type="button"
      onClick={onFinish}
      className="app-shell flex flex-col items-center justify-center gap-5 w-full text-left"
      aria-label="Devam etmek için dokun"
    >
      <div className="w-24 h-24 rounded-[1.75rem] bg-white/70 shadow-lg shadow-forest-900/10 flex items-center justify-center">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3c4 0 7 2.5 7 6.5S16.5 15 13 15c-2.2 0-4-1.3-4-3.2 0-1.5 1.1-2.6 2.6-2.6 1.2 0 2 .8 2 1.9"
            stroke="#1e6b4c"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 21c-4 0-7-2.5-7-6.5S7.5 9 11 9c2.2 0 4 1.3 4 3.2 0 1.5-1.1 2.6-2.6 2.6-1.2 0-2-.8-2-1.9"
            stroke="#cf9b3f"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center">
        <h1 className="font-display font-bold text-forest-900 text-3xl">MedLoop</h1>
        <p className="text-forest-700/60 text-xs font-semibold tracking-[0.2em] mt-1">
          AKILLI İLAÇ YÖNETİMİ
        </p>
      </div>
    </button>
  )
}
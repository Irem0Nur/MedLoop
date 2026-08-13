import { useEffect } from 'react'
import Logo from '../components/Logo.jsx'

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
      <Logo size={112} />

      <div className="text-center">
        <h1 className="font-display font-bold text-forest-900 text-3xl">MedLoop</h1>
        <p className="text-forest-700/60 text-xs font-semibold tracking-[0.2em] mt-1">
          AKILLI İLAÇ YÖNETİMİ
        </p>
      </div>
    </button>
  )
}
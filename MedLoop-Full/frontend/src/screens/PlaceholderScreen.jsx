/**
 * Hızlı Erişim'deki henüz geliştirilmemiş hedefler ("Teslim Et",
 * "Başarılarım") için ortak placeholder. Bottom nav'da karşılığı
 * olmadığından geri dönüş için kendi header'ında bir geri butonu var.
 */
export default function PlaceholderScreen({ title, description, icon, onBack }) {
  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center px-4 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri dön"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/70 flex items-center justify-center text-forest-600">
          {icon}
        </div>
        <div>
          <h1 className="font-display font-bold text-forest-900 text-xl">{title}</h1>
          <p className="text-sm text-forest-700/60 mt-2">{description}</p>
        </div>
      </div>
    </div>
  )
}
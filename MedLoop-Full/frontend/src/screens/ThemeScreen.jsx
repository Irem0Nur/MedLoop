import { THEMES } from '../data/themes.js'

/**
 * @param {string} activeThemeId
 * @param {(id: string) => void} onSelectTheme
 */
export default function ThemeScreen({ activeThemeId, onSelectTheme, onBack }) {
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
        <h1 className="font-display font-bold text-forest-900 text-lg">Tema</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10">
        <p className="text-xs text-forest-700/60 mb-4">
          Rengini seç — tasarım aynı kalır, sadece tonlar değişir.
        </p>

        <div className="flex flex-col gap-3">
          {THEMES.map((theme) => {
            const isActive = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelectTheme(theme.id)}
                className={`glass-card rounded-2xl p-4 flex items-center gap-4 text-left transition-transform active:scale-[0.98] ${
                  isActive ? 'ring-2 ring-forest-500' : ''
                }`}
              >
                <span
                  className="w-12 h-12 rounded-full shrink-0 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[1]} 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-900">{theme.name}</p>
                  {isActive && <p className="text-xs text-forest-600 font-medium mt-0.5">Şu an kullanılıyor</p>}
                </div>
                {isActive && (
                  <span className="w-6 h-6 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                    <CheckIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
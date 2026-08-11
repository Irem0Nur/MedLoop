import { ACHIEVEMENTS } from '../data/achievements.js'

/**
 * @param {Set<string>} unlockedIds - App.jsx'te kalıcı olarak tutulan kazanılmış rozet id'leri
 */
export default function AchievementsScreen({ unlockedIds, onBack }) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length

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
        <div>
          <h1 className="font-display font-bold text-forest-900 text-lg">Başarılarım</h1>
          <p className="text-xs text-forest-700/60">{unlockedCount} / {ACHIEVEMENTS.length} rozet kazanıldı</p>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedIds.has(a.id)
            return (
              <div
                key={a.id}
                className={`glass-card rounded-2xl p-4 flex flex-col gap-2.5 ${unlocked ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      unlocked ? 'bg-forest-600 text-white' : 'bg-forest-900/10 text-forest-700/40'
                    }`}
                  >
                    <AchievementIcon name={a.icon} />
                  </span>
                  {!unlocked && (
                    <span className="text-forest-700/40" aria-label="Kilitli">
                      <LockIcon />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest-900">{a.title}</p>
                  <p className="text-xs text-forest-700/60 mt-0.5 leading-snug">
                    {unlocked ? a.unlockedDescription : a.lockedDescription}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function AchievementIcon({ name }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'pill':
      return (
        <svg {...props}>
          <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" />
          <path d="M9.5 9.5 14.5 14.5" />
        </svg>
      )
    case 'stack':
      return (
        <svg {...props}>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="M3 12l9 5 9-5" /><path d="M3 16l9 5 9-5" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'star':
      return (
        <svg {...props}>
          <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.8L12 3Z" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...props}>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...props}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
      )
    default:
      return null
  }
}
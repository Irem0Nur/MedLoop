const TABS = [
  { key: 'home', label: 'Ana Sayfa', icon: HomeIcon },
  { key: 'history', label: 'Geçmiş', icon: HistoryIcon },
  { key: 'profile', label: 'Profil', icon: UserIcon },
]

export default function PharmacistBottomNav({ active, onNavigate }) {
  return (
    <nav
      className="absolute z-20 bottom-0 inset-x-0 flex items-end justify-between px-3 pb-3 pt-2 glass-card rounded-t-3xl"
      aria-label="Alt gezinme"
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate?.(key)}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 rounded-2xl transition-all ${
              isActive ? '-translate-y-3' : ''
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                isActive ? 'bg-forest-600 text-white shadow-lg shadow-forest-900/20' : 'text-forest-700/60'
              }`}
            >
              <Icon />
            </span>
            <span className={`text-[11px] font-medium ${isActive ? 'text-forest-700' : 'text-forest-700/50'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3.5 2" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
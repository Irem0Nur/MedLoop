const TABS = [
  { key: 'home', label: 'Ana Sayfa', icon: HomeIcon },
  { key: 'medicines', label: 'İlaçlarım', icon: PillIcon },
  { key: 'scan', label: 'Tara', icon: ScanIcon },
  { key: 'notifications', label: 'Bildirimler', icon: BellIcon },
  { key: 'profile', label: 'Profil', icon: UserIcon },
]

export default function BottomNav({ active = 'scan', onNavigate }) {
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
function PillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" />
      <path d="M9.5 9.5 14.5 14.5" />
    </svg>
  )
}
function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
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
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

/**
 * @param {{ soonEnabled: boolean, expiredEnabled: boolean }} prefs
 * @param {(key: 'soonEnabled' | 'expiredEnabled') => void} onTogglePref
 */
export default function NotificationSettingsScreen({ prefs, onTogglePref, onBack }) {
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
        <h1 className="font-display font-bold text-forest-900 text-lg">Bildirim Ayarları</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10">
        <p className="text-xs text-forest-700/60 mb-3">
          Kapattığın kategoriler Bildirimler sekmesinde artık görünmez.
        </p>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-forest-900/[0.06]">
            <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-400 flex items-center justify-center shrink-0">
              <ClockIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-forest-900">Yaklaşan SKT Uyarıları</p>
              <p className="text-xs text-forest-700/60 mt-0.5">Son kullanma tarihine 30 gün kalan ilaçlar</p>
            </div>
            <Toggle checked={prefs.soonEnabled} onChange={() => onTogglePref('soonEnabled')} label="Yaklaşan SKT uyarılarını aç/kapat" />
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <span className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
              <AlertIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-forest-900">Süresi Geçen İlaç Uyarıları</p>
              <p className="text-xs text-forest-700/60 mt-0.5">Son kullanma tarihi geçmiş ilaçlar</p>
            </div>
            <Toggle checked={prefs.expiredEnabled} onChange={() => onTogglePref('expiredEnabled')} label="Süresi geçen ilaç uyarılarını aç/kapat" />
          </div>
        </div>

        {!prefs.soonEnabled && !prefs.expiredEnabled && (
          <p className="text-xs text-amber-400 font-medium mt-3 px-1">
            Her iki kategori de kapalı — Bildirimler sekmesi boş görünecek.
          </p>
        )}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
        checked ? 'bg-forest-600 justify-end' : 'bg-forest-900/15 justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
      <path d="M10.3 3.9 2.7 17a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  )
}
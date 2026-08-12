import { useState } from 'react'
import PharmacistBottomNav from '../components/PharmacistBottomNav.jsx'

/**
 * @param {{ name: string, address: string, phone: string }} pharmacyProfile
 * @param {(profile: object) => void} onUpdateProfile - gerçekten kaydeder (App.jsx state'i)
 * @param {number} totalDeliveries
 * @param {number} totalMedicines
 * @param {boolean} isDarkMode
 * @param {() => void} onToggleDarkMode
 * @param {() => void} onOpenTheme
 * @param {() => void} onLogout
 */
export default function PharmacistProfileScreen({
  pharmacyProfile,
  onUpdateProfile,
  themeName,
  totalDeliveries,
  totalMedicines,
  isDarkMode,
  onToggleDarkMode,
  onOpenTheme,
  onLogout,
  onNavigate,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(pharmacyProfile)

  const startEdit = () => {
    setDraft(pharmacyProfile)
    setEditing(true)
  }

  const save = () => {
    onUpdateProfile(draft)
    setEditing(false)
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Profil</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-28 flex flex-col gap-5">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-forest-300 to-forest-600 flex items-center justify-center">
              <PharmacyIcon />
            </div>

            {editing ? (
              <div className="w-full flex flex-col gap-2.5 mt-4">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Eczane adı"
                  className={inputClass()}
                />
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  placeholder="Adres"
                  className={inputClass()}
                />
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="Telefon"
                  className={inputClass()}
                />
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 h-11 rounded-xl bg-white/80 text-forest-700 text-sm font-medium"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    className="flex-1 h-11 rounded-xl bg-forest-600 text-white text-sm font-semibold"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display font-bold text-forest-900 text-lg mt-3">{pharmacyProfile.name}</h2>
                <p className="text-sm text-forest-700/60">{pharmacyProfile.address}</p>
                <p className="text-sm text-forest-700/60">{pharmacyProfile.phone}</p>
                <button
                  type="button"
                  onClick={startEdit}
                  className="mt-3 px-4 py-2 rounded-full bg-white/70 text-forest-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <PencilIcon /> Bilgileri Düzenle
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-5">
            <StatBox value={totalDeliveries} label="Toplam Teslimat" />
            <StatBox value={totalMedicines} label="Toplam İlaç" />
          </div>
        </div>

        <section>
          <h3 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Ayarlar
          </h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-forest-900/[0.06]">
              <span className="text-forest-700 shrink-0">
                <MoonIcon />
              </span>
              <span className="flex-1 text-sm font-medium text-forest-900">Gece Modu</span>
              <DarkModeToggle checked={isDarkMode} onChange={onToggleDarkMode} />
            </div>
            <button
              type="button"
              onClick={onOpenTheme}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-forest-700 shrink-0">
                <PaletteIcon />
              </span>
              <span className="flex-1 text-sm font-medium text-forest-900">Tema</span>
              <span className="text-xs text-forest-700/50">{themeName}</span>
              <ChevronIcon />
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={onLogout}
          className="glass-card rounded-2xl py-3.5 text-center text-sm font-semibold text-rose-500"
        >
          Çıkış Yap
        </button>
      </div>

      <PharmacistBottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function DarkModeToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Gece modunu değiştir"
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
        checked ? 'bg-forest-600 justify-end' : 'bg-forest-900/15 justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-lg">{value}</p>
      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function inputClass() {
  return 'w-full h-11 rounded-xl px-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors'
}

function PharmacyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2a3 3 0 0 0 3-3c0-5-3.6-8.5-8-8.5Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700/30 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
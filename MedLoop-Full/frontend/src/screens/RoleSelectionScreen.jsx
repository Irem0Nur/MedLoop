import { useState } from 'react'
import Logo from '../components/Logo.jsx'

const ROLES = [
  {
    key: 'citizen',
    title: 'VATANDAŞ',
    body: 'İlaçlarını takip et, yönet ve teslim et.',
    icon: <PersonIcon />,
  },
  {
    key: 'pharmacist',
    title: 'ECZACI',
    body: 'QR doğrula ve teslim al.',
    icon: <PharmacistIcon />,
  },
]

/**
 * @param {(role: 'citizen' | 'pharmacist') => void} onSelectRole
 * @param {() => void} onHaveAccount - "Zaten hesabım var" bağlantısı.
 *   Bu akış için henüz bir giriş ekranı tasarlanmadı; şimdilik doğrudan
 *   uygulamaya (vatandaş rolüyle) devam ediyor.
 */
export default function RoleSelectionScreen({ onSelectRole, onHaveAccount }) {
  const [selected, setSelected] = useState(null)

  const handleContinue = (roleKey) => {
    setSelected(roleKey)
    onSelectRole?.(roleKey)
  }

  return (
    <div className="app-shell flex flex-col px-5">
      <header className="pt-6 pb-2">
        <Logo size={40} />
      </header>

      <div className="mt-4">
        <h1 className="font-display font-bold text-forest-900 text-2xl">Kim olduğunuzu seçin</h1>
        <p className="text-forest-700/60 text-sm mt-1">
          Rolünüze göre kişiselleştirilmiş bir deneyim sunuyoruz.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-7">
        {ROLES.map((role) => (
          <button
            key={role.key}
            type="button"
            onClick={() => handleContinue(role.key)}
            className={`relative text-left glass-card rounded-3xl p-6 transition-transform active:scale-[0.98] ${
              selected === role.key ? 'ring-2 ring-forest-500' : ''
            }`}
          >
            <span
              className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 ${
                selected === role.key ? 'bg-forest-600 border-forest-600' : 'border-forest-700/25'
              }`}
              aria-hidden="true"
            />
            <div className="text-forest-700 mb-6">{role.icon}</div>
            <h2 className="font-display font-bold text-forest-900 tracking-wide">{role.title}</h2>
            <p className="text-forest-700/60 text-sm mt-1">{role.body}</p>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onHaveAccount}
        className="pb-8 text-center text-forest-700/70 text-sm font-medium flex items-center justify-center gap-1.5 mx-auto"
      >
        Zaten hesabım var
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
function PharmacistIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}
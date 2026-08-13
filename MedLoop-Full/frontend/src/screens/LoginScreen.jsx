import { useState } from 'react'
import Logo from '../components/Logo.jsx'

/**
 * @param {(email: string, password: string) => Promise<void>} onSubmit
 * @param {boolean} loading
 * @param {string|null} error - backend'den ya da doğrulamadan gelen hata mesajı
 * @param {() => void} onBack - rol seçim ekranına dön
 * @param {() => void} onGoRegister - "Hesabın yok mu? Kayıt ol"
 */
export default function LoginScreen({ onSubmit, loading, error, onBack, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setFormError('E-posta ve şifre gerekli.')
      return
    }
    setFormError(null)
    onSubmit?.(email.trim().toLowerCase(), password)
  }

  const shownError = formError || error

  return (
    <div className="app-shell flex flex-col px-5">
      <header className="pt-6 pb-2 flex items-center justify-between">
        <Logo size={40} />
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

      <div className="mt-4">
        <h1 className="font-display font-bold text-forest-900 text-2xl">Giriş yap</h1>
        <p className="text-forest-700/60 text-sm mt-1">Hesabına e-posta ve şifrenle giriş yap.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-7">
        <Field label="E-posta">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            className={inputClass()}
          />
        </Field>

        <Field label="Şifre">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass()}
          />
        </Field>

        {shownError && (
          <p className="text-xs text-rose-500 font-medium -mt-1">{shownError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onGoRegister}
        className="pb-8 text-center text-forest-700/70 text-sm font-medium mx-auto"
      >
        Hesabın yok mu? <span className="text-forest-600 font-semibold">Kayıt ol</span>
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-forest-700/70 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

function inputClass() {
  return 'w-full h-12 rounded-xl px-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors'
}

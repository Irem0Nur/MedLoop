import { useState } from 'react'
import Logo from '../components/Logo.jsx'

const ROLE_LABEL = {
  citizen: 'Vatandaş',
  pharmacist: 'Eczacı',
}

/**
 * @param {'citizen'|'pharmacist'} role - RoleSelectionScreen'de seçilen rol
 * @param {(payload: {email, password, name, role}) => Promise<void>} onSubmit
 * @param {boolean} loading
 * @param {string|null} error
 * @param {() => void} onBack - rol seçim ekranına dön
 * @param {() => void} onGoLogin - "Zaten hesabın var mı? Giriş yap"
 * @param {() => void} onOpenKvkk - KVKK Aydınlatma Metni'ni yeni sekmede açar
 */
export default function RegisterScreen({ role, onSubmit, loading, error, onBack, onGoLogin, onOpenKvkk }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [formError, setFormError] = useState(null)

  const isPharmacist = role === 'pharmacist'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError(isPharmacist ? 'Eczane adı gerekli.' : 'Ad soyad gerekli.')
      return
    }
    if (!email.trim()) {
      setFormError('E-posta gerekli.')
      return
    }
    if (password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Şifreler eşleşmiyor.')
      return
    }
    if (!kvkkAccepted) {
      setFormError('Devam etmek için KVKK Aydınlatma Metni\'ni onaylaman gerekiyor.')
      return
    }
    setFormError(null)
    onSubmit?.({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      role,
      kvkkAccepted,
    })
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
        <h1 className="font-display font-bold text-forest-900 text-2xl">Hesap oluştur</h1>
        <p className="text-forest-700/60 text-sm mt-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold align-middle mr-1.5">
            {ROLE_LABEL[role] ?? role}
          </span>
          olarak kayıt oluyorsun.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6 pb-8 overflow-y-auto">
        <Field label={isPharmacist ? 'Eczane adı' : 'Ad soyad'}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isPharmacist ? 'ör. Merkez Eczanesi' : 'ör. Ahmet Yılmaz'}
            className={inputClass()}
          />
        </Field>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 6 karakter"
            className={inputClass()}
          />
        </Field>

        <Field label="Şifre (tekrar)">
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass()}
          />
        </Field>

        <label className="flex items-start gap-2.5 mt-1">
          <input
            type="checkbox"
            checked={kvkkAccepted}
            onChange={(e) => setKvkkAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-mint-200 text-forest-600 shrink-0"
          />
          <span className="text-xs text-forest-700/70 leading-snug">
            <button type="button" onClick={onOpenKvkk} className="text-forest-600 font-semibold underline underline-offset-2">
              KVKK Aydınlatma Metni
            </button>
            'ni okudum, kişisel verilerimin belirtilen amaçlarla işlenmesini kabul ediyorum.
          </span>
        </label>

        {shownError && (
          <p className="text-xs text-rose-500 font-medium -mt-1">{shownError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
        >
          {loading ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}
        </button>

        <button
          type="button"
          onClick={onGoLogin}
          className="text-center text-forest-700/70 text-sm font-medium mx-auto"
        >
          Zaten hesabın var mı? <span className="text-forest-600 font-semibold">Giriş yap</span>
        </button>
      </form>
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

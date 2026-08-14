import { useState } from 'react'
import Logo from '../components/Logo.jsx'

/**
 * "Şifremi unuttum" akışı — iki adımlı, tek ekranda:
 *   1) E-posta gir -> backend'e POST /auth/forgot-password (varsa 6 haneli
 *      kod e-postaya gönderilir; hesap var/yok bilgisi sızdırılmaz, backend
 *      her durumda aynı genel mesajı döner).
 *   2) E-postaya gelen kod + yeni şifre -> POST /auth/reset-password.
 *      Başarılı olursa 3. adımda kısa bir onay gösterilip Giriş ekranına
 *      dönülür.
 *
 * @param {(email: string) => Promise<void>} onRequestCode
 * @param {(payload: {email, code, newPassword}) => Promise<void>} onResetPassword
 * @param {() => void} onBack - Giriş ekranına dön
 */
export default function ForgotPasswordScreen({ onRequestCode, onResetPassword, onBack }) {
  const [step, setStep] = useState('email') // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRequestCode = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('E-posta gerekli.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onRequestCode?.(email.trim().toLowerCase())
      setStep('reset')
    } catch (err) {
      setError(err?.message || 'Bir şeyler ters gitti, tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Kod gerekli.')
      return
    }
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onResetPassword?.({ email: email.trim().toLowerCase(), code: code.trim(), newPassword })
      setStep('done')
    } catch (err) {
      setError(err?.message || 'Kod geçersiz veya süresi dolmuş olabilir.')
    } finally {
      setLoading(false)
    }
  }

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

      {step === 'email' && (
        <>
          <div className="mt-4">
            <h1 className="font-display font-bold text-forest-900 text-2xl">Şifremi unuttum</h1>
            <p className="text-forest-700/60 text-sm mt-1">
              Hesabına kayıtlı e-posta adresini gir, sana bir sıfırlama kodu gönderelim.
            </p>
          </div>

          <form onSubmit={handleRequestCode} className="flex flex-col gap-4 mt-7">
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

            {error && <p className="text-xs text-rose-500 font-medium -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
            >
              {loading ? 'Gönderiliyor…' : 'Sıfırlama Kodu Gönder'}
            </button>
          </form>
        </>
      )}

      {step === 'reset' && (
        <>
          <div className="mt-4">
            <h1 className="font-display font-bold text-forest-900 text-2xl">Kodu gir</h1>
            <p className="text-forest-700/60 text-sm mt-1">
              <span className="font-semibold text-forest-700">{email}</span> adresine bir hesap
              varsa 6 haneli bir kod gönderdik. Kodu ve yeni şifreni aşağıya gir.
            </p>
          </div>

          <form onSubmit={handleReset} className="flex flex-col gap-4 mt-7">
            <Field label="Doğrulama kodu">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6 haneli kod"
                className={inputClass()}
              />
            </Field>

            <Field label="Yeni şifre">
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className={inputClass()}
              />
            </Field>

            <Field label="Yeni şifre (tekrar)">
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass()}
              />
            </Field>

            {error && <p className="text-xs text-rose-500 font-medium -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
            >
              {loading ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email')
                setError(null)
              }}
              className="text-center text-forest-700/70 text-sm font-medium mx-auto"
            >
              Kod gelmedi mi? <span className="text-forest-600 font-semibold">Tekrar dene</span>
            </button>
          </form>
        </>
      )}

      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 -mt-10">
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center text-forest-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-forest-900 text-xl">Şifren güncellendi</h1>
            <p className="text-forest-700/60 text-sm mt-1">Yeni şifrenle giriş yapabilirsin.</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 h-12 px-8 rounded-2xl bg-forest-600 text-white font-display font-semibold shadow-lg shadow-forest-900/20"
          >
            Giriş Yap'a dön
          </button>
        </div>
      )}
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

import { useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'

const FORM_OPTIONS = ['Tablet', 'Kapsül', 'Şurup', 'İğne', 'Merhem', 'Damla']

/**
 * Tarama başarılı olduğunda ya da "Manuel Ekle" seçildiğinde açılan ekran.
 * Tarama sonrası backend'den (OCR/barkod) gelen taslak bilgileri gösterir;
 * manuel modda tüm alanlar boş başlar ve kullanıcı elle doldurur.
 *
 * @param {{ image: string|null, draft: object|null }} scanResult
 * @param {(medicine: object) => void} onSave
 */
export default function AddMedicineScreen({ scanResult, onSave, onCancel }) {
  const { image, draft } = scanResult
  const isManual = !draft

  const [form, setForm] = useState(() => ({
    name: draft?.name ?? '',
    dosage: draft?.dosage ?? '',
    form: draft?.form ?? FORM_OPTIONS[0],
    quantity: draft?.quantity ?? 1,
    batchNo: draft?.batchNo ?? '',
    expiryDate: draft?.expiryDate ?? '',
    note: '',
  }))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const daysUntilExpiry = useMemo(() => {
    if (!form.expiryDate) return null
    const diff = new Date(form.expiryDate) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [form.expiryDate])

  const update = (field) => (e) => {
    const value = field === 'quantity' ? Number(e.target.value) : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'İlaç adı gerekli.'
    if (!form.quantity || form.quantity < 1) next.quantity = 'En az 1 adet girilmeli.'
    if (!form.expiryDate) next.expiryDate = 'Son kullanma tarihi gerekli.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const medicine = { ...form, image, id: crypto.randomUUID() }
    setSaved(true)
    setTimeout(() => onSave?.(medicine), 700)
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 pt-5 pb-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Vazgeç"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-semibold text-forest-900 text-base">
          {isManual ? 'İlaç Ekle' : 'İlaç Bilgilerini Onayla'}
        </h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </header>

      <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 flex flex-col gap-5">
        <div className="flex items-center gap-4 glass-card rounded-2xl p-3">
          {image ? (
            <img src={image} alt="Taranan ilaç kutusu" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-mint-200 flex items-center justify-center text-forest-600">
              {isManual && <PillIcon />}
            </div>
          )}
          <div>
            <p className="text-xs text-forest-700/60 font-medium">{isManual ? 'Manuel Giriş' : 'Tarandı'}</p>
            <p className="text-sm text-forest-900 font-semibold">
              {isManual ? 'İlaç bilgilerini elle gir' : 'Bilgileri kontrol edip kaydet'}
            </p>
          </div>
        </div>

        <Field label="İlaç adı" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="ör. Amoksisilin"
            className={inputClass(errors.name)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Doz">
            <input
              type="text"
              value={form.dosage}
              onChange={update('dosage')}
              placeholder="ör. 500 mg"
              className={inputClass()}
            />
          </Field>
          <Field label="Form">
            <select value={form.form} onChange={update('form')} className={inputClass()}>
              {FORM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Adet" error={errors.quantity}>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={update('quantity')}
              className={inputClass(errors.quantity)}
            />
          </Field>
          <Field label="Lot No">
            <input
              type="text"
              value={form.batchNo}
              onChange={update('batchNo')}
              placeholder="opsiyonel"
              className={inputClass()}
            />
          </Field>
        </div>

        <Field
          label="Son kullanma tarihi"
          error={errors.expiryDate}
          hint={
            daysUntilExpiry !== null && !errors.expiryDate
              ? daysUntilExpiry >= 0
                ? `Son kullanma tarihine ${daysUntilExpiry} gün kaldı.`
                : 'Bu tarih geçmiş — kaydetmeden önce kontrol et.'
              : null
          }
        >
          <input
            type="date"
            value={form.expiryDate}
            onChange={update('expiryDate')}
            className={inputClass(errors.expiryDate)}
          />
        </Field>

        <Field label="Not (opsiyonel)">
          <textarea
            value={form.note}
            onChange={update('note')}
            rows={3}
            placeholder="ör. Yemekten sonra al"
            className={inputClass() + ' resize-none'}
          />
        </Field>

        <button
          type="submit"
          disabled={saved}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
        >
          {saved ? (
            <>
              <CheckIcon /> Dolaba Eklendi
            </>
          ) : (
            'Dolabıma Ekle'
          )}
        </button>
      </form>

      <BottomNav active="scan" />
    </div>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-forest-700/70 uppercase tracking-wide">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
      {hint && !error && <span className="text-xs text-forest-700/60">{hint}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full h-12 rounded-xl px-3.5 bg-white/70 border text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors ${
    error ? 'border-rose-400' : 'border-mint-200'
  }`
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function PillIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" />
      <path d="M9.5 9.5 14.5 14.5" />
    </svg>
  )
}
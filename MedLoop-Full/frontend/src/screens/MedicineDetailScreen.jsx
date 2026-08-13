import { useState } from 'react'
import { getExpiryStatus } from '../utils/expiry.js'

const FORM_OPTIONS = ['Tablet', 'Kapsül', 'Şurup', 'İğne', 'Merhem', 'Damla']

/**
 * @param {object} medicine - düzenlenecek ilaç kaydı
 * @param {(medicine: object) => Promise<void>} onSave - backend'e PATCH eder
 * @param {(id: number) => Promise<void>} onDelete - backend'den DELETE eder
 */
export default function MedicineDetailScreen({ medicine, onSave, onDelete, onBack }) {
  const [form, setForm] = useState({ ...medicine })
  const [errors, setErrors] = useState({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)

  const status = getExpiryStatus(form.expiryDate)

  const update = (field) => (e) => {
    const value = field === 'quantity' ? Number(e.target.value) : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'İlaç adı gerekli.'
    if (!form.quantity || form.quantity < 1) next.quantity = 'En az 1 adet girilmeli.'
    if (!form.expiryDate) next.expiryDate = 'Son kullanma tarihi gerekli.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave?.(form)
      setSaved(true)
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err?.message || 'Kaydedilemedi, tekrar dene.' }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete?.(form.id)
    } catch (err) {
      setDeleting(false)
      setConfirmingDelete(false)
      setErrors((prev) => ({ ...prev, submit: err?.message || 'Silinemedi, tekrar dene.' }))
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 pt-5 pb-2">
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
        <h1 className="font-display font-semibold text-forest-900 text-base">İlaç Detayı</h1>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          aria-label="İlacı sil"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-rose-500"
        >
          <TrashIcon />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-4 glass-card rounded-2xl p-3">
          {form.image ? (
            <img src={form.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-mint-200" />
          )}
          <div>
            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.badgeClass}`}>
              {status.label}
            </span>
            <p className="text-sm text-forest-900 font-semibold mt-1">Bilgileri düzenle</p>
          </div>
        </div>

        <Field label="İlaç adı" error={errors.name}>
          <input type="text" value={form.name} onChange={update('name')} className={inputClass(errors.name)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Doz">
            <input type="text" value={form.dosage} onChange={update('dosage')} className={inputClass()} />
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
            <input type="number" min={1} value={form.quantity} onChange={update('quantity')} className={inputClass(errors.quantity)} />
          </Field>
          <Field label="Lot No">
            <input type="text" value={form.batchNo} onChange={update('batchNo')} className={inputClass()} />
          </Field>
        </div>

        <Field label="Son kullanma tarihi" error={errors.expiryDate}>
          <input type="date" value={form.expiryDate} onChange={update('expiryDate')} className={inputClass(errors.expiryDate)} />
        </Field>

        <Field label="Not (opsiyonel)">
          <textarea value={form.note} onChange={update('note')} rows={3} className={inputClass() + ' resize-none'} />
        </Field>

        {errors.submit && <p className="text-xs text-rose-500 font-medium -mt-2">{errors.submit}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
        >
          {saved ? (
            <>
              <CheckIcon /> Kaydedildi
            </>
          ) : saving ? (
            'Kaydediliyor…'
          ) : (
            'Değişiklikleri Kaydet'
          )}
        </button>
      </form>

      {confirmingDelete && (
        <div className="absolute inset-0 z-30 bg-forest-900/40 flex items-end" role="dialog" aria-modal="true">
          <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4">
            <h2 className="font-display font-bold text-forest-900 text-lg">İlacı sil?</h2>
            <p className="text-sm text-forest-700/70">
              "{form.name}" dolabından kaldırılacak. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex-1 h-12 rounded-xl bg-white/80 text-forest-700 font-medium disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-medium disabled:opacity-70"
              >
                {deleting ? 'Siliniyor…' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-forest-700/70 uppercase tracking-wide">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full h-12 rounded-xl px-3.5 bg-white/70 border text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:border-forest-500 transition-colors ${
    error ? 'border-rose-400' : 'border-mint-200'
  }`
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

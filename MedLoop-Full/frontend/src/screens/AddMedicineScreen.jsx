import { useEffect, useMemo, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { catalogApi } from '../utils/api.js'

const FORM_OPTIONS = ['Tablet', 'Kapsül', 'Şurup', 'İğne', 'Merhem', 'Damla']

// Katalog ürün adının içinden dozu ayıklamaya çalışır (backend'deki
// split_catalog_name_and_dosage ile aynı mantık) — ör.
// "RANEKS 20 MG 28 ENTERİK KAPLI TABLET" -> { name: "RANEKS", dosage: "20 MG" }
function splitNameAndDosage(productName) {
  const match = productName
    .trim()
    .match(/^(.*?)\s*(\d+(?:[.,]\d+)?\s?(?:mg|mcg|g|ml))\b/i)
  if (!match) return { name: productName.trim(), dosage: '' }
  return { name: match[1].trim(), dosage: match[2].trim() }
}

/**
 * Tarama başarılı olduğunda açılan ekran. Backend'den (OCR/barkod) gelen
 * taslak bilgileri kullanıcıya gösterir; kullanıcı onaylayıp düzenleyerek
 * ilacı dolabına ekler. İlaç adı yazılırken /catalog/search ile gerçek
 * Türkiye ilaç kataloğundan otomatik tamamlama önerileri gösterilir.
 *
 * @param {{ image: string, draft: object }} scanResult
 * @param {(medicine: object) => Promise<void>} onSave - backend'e POST eder
 */
export default function AddMedicineScreen({ scanResult, onSave, onCancel }) {
  const { image, draft } = scanResult

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const skipNextSearch = useRef(false)

  const daysUntilExpiry = useMemo(() => {
    if (!form.expiryDate) return null
    const diff = new Date(form.expiryDate) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [form.expiryDate])

  const update = (field) => (e) => {
    const value = field === 'quantity' ? Number(e.target.value) : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // İlaç adı en az 2 karakter olduğunda 300ms debounce ile katalogda arar.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }
    const query = form.name.trim()
    if (query.length < 2) {
      setSuggestions([])
      setSuggestionsOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await catalogApi.search(query, 6)
        setSuggestions(data?.results ?? [])
        setSuggestionsOpen(true)
      } catch {
        // Katalog araması opsiyonel bir yardımcı özellik — sessizce vazgeç.
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [form.name])

  const handlePickSuggestion = (item) => {
    const { name, dosage } = splitNameAndDosage(item.productName)
    skipNextSearch.current = true
    setForm((prev) => ({ ...prev, name, dosage: dosage || prev.dosage }))
    setSuggestionsOpen(false)
    setSuggestions([])
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
      await onSave?.({ ...form, image })
      setSaved(true)
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err?.message || 'İlaç kaydedilemedi, tekrar dene.' }))
      setSaving(false)
    }
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
        <h1 className="font-display font-semibold text-forest-900 text-base">İlaç Bilgilerini Onayla</h1>
        <div className="w-10 h-10" aria-hidden="true" />
      </header>

      <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 flex flex-col gap-5">
        <div className="flex items-center gap-4 glass-card rounded-2xl p-3">
          {image ? (
            <img src={image} alt="Taranan ilaç kutusu" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-mint-200" />
          )}
          <div>
            <p className="text-xs text-forest-700/60 font-medium">Tarandı</p>
            <p className="text-sm text-forest-900 font-semibold">Bilgileri kontrol edip kaydet</p>
          </div>
        </div>

        <div className="relative">
          <Field label="İlaç adı" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
              placeholder="ör. Amoksisilin"
              autoComplete="off"
              className={inputClass(errors.name)}
            />
          </Field>

          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1.5 z-20 glass-card rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSuggestion(item)}
                    className="w-full text-left px-4 py-2.5 border-b border-forest-900/[0.06] last:border-b-0"
                  >
                    <p className="text-sm font-semibold text-forest-900">{item.productName}</p>
                    {item.activeIngredient && (
                      <p className="text-xs text-forest-700/60 truncate">{item.activeIngredient}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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

        {errors.submit && <p className="text-xs text-rose-500 font-medium -mt-2">{errors.submit}</p>}

        <button
          type="submit"
          disabled={saving || saved}
          className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
        >
          {saved ? (
            <>
              <CheckIcon /> Dolaba Eklendi
            </>
          ) : saving ? (
            'Kaydediliyor…'
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

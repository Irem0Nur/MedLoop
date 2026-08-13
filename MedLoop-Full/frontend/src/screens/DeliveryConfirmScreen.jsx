import { useEffect, useState } from 'react'
import { deliveriesApi } from '../utils/api.js'

/**
 * Eczacı QR'ı okuttuktan sonra açılır. Kendi başına backend'e gidip
 * GET /deliveries/<token> ile teslimat detayını çeker (token QR'dan gelir,
 * ilaç verisi QR'ın içinde değil — güvenlik için sunucu tarafında doğrulanır).
 * "Teslimi Onayla"da POST /deliveries/<token>/confirm çağrılır; bu, ilgili
 * ilaçları vatandaşın hesabında 'delivered' yapar, puan ekler ve bildirim
 * gönderir.
 *
 * @param {string} token - taranan QR'dan gelen teslimat token'ı
 * @param {(delivery: object) => void} onConfirmed - onay başarılı olduğunda
 *   (eczacının teslimat geçmişini güncellemek için)
 * @param {() => void} onDone - onay ekranı birkaç saniye gösterildikten sonra çağrılır
 */
export default function DeliveryConfirmScreen({ token, onConfirmed, onCancel, onDone }) {
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    deliveriesApi
      .get(token)
      .then((data) => {
        if (cancelled) return
        if (data.delivery.status !== 'pending') {
          setError(
            data.delivery.status === 'expired'
              ? 'Bu QR kodun süresi doldu. Vatandaştan yeni bir QR oluşturmasını iste.'
              : 'Bu teslimat zaten işlendi.'
          )
        }
        setDelivery(data.delivery)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Teslimat bulunamadı.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      const data = await deliveriesApi.confirm(token)
      setDelivery(data.delivery)
      setConfirmed(true)
      onConfirmed?.(data.delivery)
    } catch (err) {
      setError(err?.message || 'Teslimat onaylanamadı, tekrar dene.')
    } finally {
      setConfirming(false)
    }
  }

  useEffect(() => {
    if (!confirmed) return
    const timer = setTimeout(() => onDone?.(), 1800)
    return () => clearTimeout(timer)
  }, [confirmed, onDone])

  if (confirmed && delivery) {
    return (
      <div className="app-shell flex flex-col items-center justify-center gap-4 px-10 text-center">
        <div className="w-20 h-20 rounded-full bg-forest-600 text-white flex items-center justify-center">
          <CheckIcon />
        </div>
        <div>
          <h1 className="font-display font-bold text-forest-900 text-xl">Teslimat Onaylandı</h1>
          <p className="text-sm text-forest-700/60 mt-2">
            {delivery.items.length} ilaç için {delivery.citizenName ?? 'vatandaşın'} hesabına puan eklendi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 flex items-center gap-3 px-4 pt-5">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Vazgeç"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-forest-900 text-lg">Teslimatı Onayla</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-8 flex flex-col gap-5">
        {loading ? (
          <div className="glass-card rounded-2xl p-6 text-center mt-4">
            <p className="text-sm text-forest-900 font-medium">Teslimat bilgisi alınıyor…</p>
          </div>
        ) : (
          <>
            {delivery && (
              <>
                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                    <PersonIcon />
                  </span>
                  <div>
                    <p className="text-xs text-forest-700/60">Teslim eden</p>
                    <p className="text-sm font-semibold text-forest-900">{delivery.citizenName ?? 'Bilinmeyen vatandaş'}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
                    Teslim Edilecek İlaçlar ({delivery.items.length})
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {delivery.items.map((item) => (
                      <li key={item.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-forest-900">{item.name}</p>
                          <p className="text-xs text-forest-700/60">{item.dosage} · {item.form}</p>
                        </div>
                        <span className="text-xs font-medium text-forest-700/70">{item.quantity} adet</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {error && <p className="text-sm text-rose-500 font-medium text-center">{error}</p>}

            {delivery?.status === 'pending' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="mt-2 w-full h-14 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 disabled:opacity-70"
              >
                {confirming ? 'Onaylanıyor…' : 'Teslimi Onayla'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

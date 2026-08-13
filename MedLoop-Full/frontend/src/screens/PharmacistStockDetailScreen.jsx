import { getStockGroups, getDisposedGroups, mockBarcode, CRITICAL_STOCK_THRESHOLD } from '../utils/pharmacyStock.js'
import { getExpiryStatus } from '../utils/expiry.js'

/**
 * @param {string} medicineName - stok grubunun anahtarı (isim)
 * @param {boolean} isDisposedView - "İmha Edilenler" listesinden mi açıldı
 * @param {(deliveryId: string) => void} onDispose - gerçekten imhaya gönderir (App.jsx state günceller)
 */
export default function PharmacistStockDetailScreen({ deliveries, medicineName, isDisposedView, onDispose, onBack }) {
  const groups = isDisposedView ? getDisposedGroups(deliveries) : getStockGroups(deliveries)
  const group = groups.find((g) => g.name === medicineName)

  if (!group) {
    return (
      <div className="app-shell flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-forest-700/60">Bu ilaç artık stokta görünmüyor.</p>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded-full bg-forest-600 text-white text-sm font-semibold">
          Geri Dön
        </button>
      </div>
    )
  }

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
        <h1 className="font-display font-bold text-forest-900 text-lg truncate">{group.name}</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-5">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-forest-700/60">{group.dosage} · {group.form}</p>
              <p className="text-[11px] text-forest-700/45 mt-1 font-mono tracking-wide">
                Barkod: {mockBarcode(group.name)}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {!isDisposedView && group.isCritical && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-rose-100 text-rose-500">Kritik</span>
              )}
              {!isDisposedView && group.worstExpiryStatus !== 'safe' && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-400">SKT</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <StatBox value={group.totalQuantity} label={isDisposedView ? 'İmha Edilen Adet' : 'Mevcut Stok'} />
            <StatBox value={group.batches.length} label="Parti Sayısı" />
          </div>

          {!isDisposedView && (
            <p className="text-[11px] text-forest-700/50 mt-3 text-center">
              Kritik stok eşiği: {CRITICAL_STOCK_THRESHOLD} adet (eczane geneli sabit değer)
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            {isDisposedView ? 'İmha Edilen Partiler' : 'Partiler'}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.batches.map((b) => {
              const expiryStatus = b.expiryDate ? getExpiryStatus(b.expiryDate) : null
              return (
                <li key={`${b.deliveryId}-${b.batchNo}-${b.quantity}`} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-forest-900">{b.citizenName ?? 'Vatandaş'}</p>
                      <p className="text-xs text-forest-700/60 mt-0.5">Parti No: {b.batchNo}</p>
                      {b.expiryDate && (
                        <p
                          className={`text-xs mt-0.5 font-medium ${
                            expiryStatus.key === 'expired'
                              ? 'text-rose-500'
                              : expiryStatus.key === 'soon'
                                ? 'text-amber-400'
                                : 'text-forest-700/60'
                          }`}
                        >
                          SKT: {new Date(b.expiryDate).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-forest-900 shrink-0">{b.quantity} adet</span>
                  </div>

                  {isDisposedView ? (
                    <p className="text-[11px] text-forest-700/50 mt-2">
                      İmha edildi: {new Date(b.disposedAt).toLocaleDateString('tr-TR')}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDispose(b.deliveryId)}
                      className="mt-3 w-full h-10 rounded-lg bg-rose-500 text-white text-xs font-semibold"
                    >
                      İmhaya Gönder
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-xl">{value}</p>
      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
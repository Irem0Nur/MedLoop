import { useState } from 'react'

/**
 * @param {() => void} onClearData - ilaçlar/puan/bildirim/başarı verilerini
 *   gerçekten sıfırlar (App.jsx'te tanımlı)
 */
export default function PrivacyScreen({ onClearData, onBack }) {
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)

  const handleConfirm = () => {
    onClearData?.()
    setConfirming(false)
    setCleared(true)
    setTimeout(() => setCleared(false), 2500)
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
        <h1 className="font-display font-bold text-forest-900 text-lg">Gizlilik</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-5">
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-forest-900 mb-2">Verilerin nerede saklanıyor?</h2>
          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop'un bu sürümünde ilaçların, puanların ve tercihlerin yalnızca bu cihazdaki
            tarayıcında tutulur; bir sunucuya gönderilmez. Sayfayı yenilediğinde veya sekmeyi
            kapatıp tekrar açtığında veriler, backend entegrasyonu tamamlanana kadar sıfırlanabilir.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-forest-900 mb-2">Konum izni</h2>
          <p className="text-xs text-forest-700/70 leading-relaxed">
            Yakındaki eczaneleri gösterebilmek için tarayıcından konum izni istenir. Bu izni
            istediğin an tarayıcı ayarlarından geri alabilirsin.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-forest-900 mb-2">Kamera izni</h2>
          <p className="text-xs text-forest-700/70 leading-relaxed">
            İlaç Tara özelliği yalnızca sen taramayı başlattığında kamerayı kullanır; görüntüler
            cihazından dışarı gönderilmeden ilaç bilgisi çıkarımında kullanılır.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-forest-900 mb-1">Tüm verilerini sil</h2>
          <p className="text-xs text-forest-700/60 mb-3">
            Dolabındaki tüm ilaçlar, MedLoop puanın, bildirim geçmişin ve başarıların kalıcı olarak silinir.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full h-11 rounded-xl bg-rose-500 text-white text-sm font-semibold"
          >
            {cleared ? 'Verilerin silindi ✓' : 'Tüm Verilerimi Sil'}
          </button>
        </div>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-30 bg-forest-900/40 flex items-end" role="dialog" aria-modal="true">
          <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4">
            <h2 className="font-display font-bold text-forest-900 text-lg">Emin misin?</h2>
            <p className="text-sm text-forest-700/70">
              Dolabındaki ilaçlar, puanların ve bildirim geçmişin kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 h-12 rounded-xl bg-white/80 text-forest-700 font-medium"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-medium"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
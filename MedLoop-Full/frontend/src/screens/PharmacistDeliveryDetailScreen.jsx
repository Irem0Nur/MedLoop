export default function PharmacistDeliveryDetailScreen({ delivery, onBack }) {
  const totalQuantity = delivery.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

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
        <h1 className="font-display font-bold text-forest-900 text-lg">Teslimat Kaydı</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-5">
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-full bg-forest-600 text-white flex items-center justify-center mb-3">
            <CheckIcon />
          </span>
          <h2 className="font-display font-bold text-forest-900 text-lg">{delivery.citizenName ?? 'Vatandaş'}</h2>
          <p className="text-xs text-forest-700/60 mt-1">
            {new Date(delivery.confirmedAt).toLocaleString('tr-TR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <div className="grid grid-cols-2 gap-3 w-full mt-5">
            <StatBox value={delivery.items.length} label="İlaç Çeşidi" />
            <StatBox value={totalQuantity} label="Toplam Adet" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Teslim Edilen İlaçlar
          </h3>
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
function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
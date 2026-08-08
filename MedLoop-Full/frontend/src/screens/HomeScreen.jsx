import BottomNav from '../components/BottomNav.jsx'

/**
 * Not: Bu ekran şu anki önceliğin (tarama + ilaç ekleme) bağlamını
 * gösterebilmek için eklenen minimal bir taslaktır — asıl ana sayfa
 * tasarımı ayrı bir iş kalemi olarak ele alınmalı.
 */
export default function HomeScreen({ medicines, onScan }) {
  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-forest-700/60">Merhaba,</p>
          <h1 className="font-display font-bold text-forest-900 text-xl">Arya GİM</h1>
        </div>
      </header>

      <div className="relative z-10 px-5 mt-6">
        <button
          type="button"
          onClick={onScan}
          className="w-full h-16 rounded-2xl bg-forest-600 text-white font-display font-semibold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20"
        >
          <ScanIcon /> İlaç Tara
        </button>
      </div>

      <section className="relative z-10 flex-1 overflow-y-auto px-5 mt-8 pb-28">
        <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
          Dijital İlaç Dolabım {medicines.length > 0 && `(${medicines.length})`}
        </h2>

        {medicines.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-forest-900 font-medium">Dolabın henüz boş.</p>
            <p className="text-xs text-forest-700/60 mt-1">
              İlk ilacını eklemek için “İlaç Tara”ya dokun.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {medicines.map((m) => (
              <li key={m.id} className="glass-card rounded-2xl p-3 flex items-center gap-3">
                {m.image && <img src={m.image} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-900 truncate">{m.name}</p>
                  <p className="text-xs text-forest-700/60">
                    {m.dosage} · {m.form} · {m.quantity} adet
                  </p>
                </div>
                <span className="text-[11px] font-medium text-forest-700/60">{m.expiryDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav active="home" onNavigate={(key) => key === 'scan' && onScan?.()} />
    </div>
  )
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
    </svg>
  )
}

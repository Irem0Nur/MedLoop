import { useState } from 'react'

const FAQ = [
  {
    q: 'İlaç taraması nasıl çalışır?',
    a: 'Ana sayfadaki "İlaç Tara" butonuna dokun, kutuyu çerçeve içine getir ve tarama butonuna bas. Tanınan bilgiler otomatik olarak forma dolar, kaydetmeden önce kontrol edip düzenleyebilirsin.',
  },
  {
    q: 'Son kullanma tarihi uyarılarını nasıl yönetirim?',
    a: 'Profil > Bildirim Ayarları\'ndan "Yaklaşan SKT" ve "Süresi Geçen İlaç" uyarılarını ayrı ayrı açıp kapatabilirsin.',
  },
  {
    q: 'MedLoop puanını nasıl kazanırım?',
    a: 'Dolabına her ilaç eklediğinde otomatik olarak puan kazanırsın. Kazandığın puanları ve rozetleri Profil > Başarılarım\'dan takip edebilirsin.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Bu sürümde tüm veriler yalnızca cihazında tutulur. Detaylar için Profil > Gizlilik sayfasına bakabilirsin.',
  },
  {
    q: 'Yakındaki eczaneler nasıl bulunuyor?',
    a: 'Ana sayfadaki harita, tarayıcı konumunu kullanarak anlaşmalı eczaneleri ve mesafelerini gösterir. Konum izni istediğin zaman tarayıcı ayarlarından değiştirilebilir.',
  },
]

export default function HelpSupportScreen({ onBack }) {
  const [openIndex, setOpenIndex] = useState(null)

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
        <h1 className="font-display font-bold text-forest-900 text-lg">Yardım & Destek</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-5">
        <section>
          <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Sık Sorulan Sorular
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            {FAQ.map((item, i) => {
              const isOpen = openIndex === i
              return (
                <div key={item.q} className={i < FAQ.length - 1 ? 'border-b border-forest-900/[0.06]' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-medium text-forest-900">{item.q}</span>
                    <span className={`text-forest-700/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {isOpen && (
                    <p className="px-4 pb-4 text-xs text-forest-700/70 leading-relaxed">{item.a}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Bize Ulaş
          </h2>
          <a
            href="mailto:destek@medloop.app?subject=MedLoop%20Destek%20Talebi"
            className="glass-card rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
              <MailIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-forest-900">E-posta ile yaz</p>
              <p className="text-xs text-forest-700/60">destek@medloop.app</p>
            </div>
            <ChevronRightIcon />
          </a>
        </section>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700/30 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  )
}
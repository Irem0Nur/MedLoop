export default function AboutScreen({ onBack }) {
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
        <h1 className="font-display font-bold text-forest-900 text-lg">Hakkımızda</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-10 flex flex-col gap-5">
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[1.25rem] bg-white/70 flex items-center justify-center mb-3">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 3c4 0 7 2.5 7 6.5S16.5 15 13 15c-2.2 0-4-1.3-4-3.2 0-1.5 1.1-2.6 2.6-2.6 1.2 0 2 .8 2 1.9" stroke="#1e6b4c" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M12 21c-4 0-7-2.5-7-6.5S7.5 9 11 9c2.2 0 4 1.3 4 3.2 0 1.5-1.1 2.6-2.6 2.6-1.2 0-2-.8-2-1.9" stroke="#cf9b3f" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-forest-900 text-lg">MedLoop</h2>
          <p className="text-xs text-forest-700/50 mt-0.5">Sürüm 1.0.0</p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-forest-900 mb-2">Misyonumuz</h3>
          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop, evlerde biriken kullanılmayan veya süresi geçmiş ilaçların güvenli şekilde
            takip edilip anlaşmalı eczanelere geri kazandırılmasını kolaylaştırmak için
            geliştirilen bir dijital ilaç yönetimi uygulamasıdır. Amacımız hem bireysel ilaç
            takibini kolaylaştırmak hem de çevreye ve halk sağlığına zarar veren kontrolsüz ilaç
            imhasının önüne geçmek.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-forest-900 mb-2">Neler yapabilirsin?</h3>
          <ul className="text-xs text-forest-700/70 leading-relaxed list-disc pl-4 flex flex-col gap-1">
            <li>İlaç kutunu tarayarak saniyeler içinde dijital dolabına ekle</li>
            <li>Son kullanma tarihi yaklaşan/geçen ilaçlar için otomatik uyarı al</li>
            <li>Yakındaki anlaşmalı eczaneleri haritada gör, yol tarifi al</li>
            <li>İlaç ekledikçe MedLoop puanı ve rozet kazan</li>
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-forest-900 mb-2">Proje</h3>
          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop, sıfır atık ve akıllı ilaç yönetimi odaklı bir öğrenci projesi olarak
            geliştirilmektedir.
          </p>
        </div>
      </div>
    </div>
  )
}
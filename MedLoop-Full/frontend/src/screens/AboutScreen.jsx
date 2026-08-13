import Logo from '../components/Logo.jsx'
export default function AboutScreen({
  onBack,
  onPrivacy,
  onTerms,
}) {
  return (
    <div className="app-shell flex flex-col">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="relative z-10 flex items-center gap-3 px-4 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri dön"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-700 shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h1 className="font-display font-bold text-forest-900 text-lg">
          Hakkımızda
        </h1>
      </header>


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-12 flex flex-col gap-5">

        {/* =================================================
            APP IDENTITY
        ================================================== */}

        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center">

          <div className="mb-3">
            <Logo size={64} />
          </div>

          <h2 className="font-display font-bold text-forest-900 text-lg">
            MedLoop
          </h2>

          <p className="text-xs text-forest-700/50 mt-0.5">
            Dijital İlaç Yönetimi
          </p>

          <p className="text-[11px] text-forest-700/40 mt-1">
            Sürüm 1.0.0
          </p>

        </div>


        {/* =================================================
            ABOUT MEDLOOP
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            MedLoop Nedir?
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop, bireylerin evlerinde bulunan ilaçları daha düzenli
            ve bilinçli şekilde takip edebilmesine yardımcı olmak amacıyla
            geliştirilen dijital bir ilaç yönetimi uygulamasıdır.
          </p>

          <p className="text-xs text-forest-700/70 leading-relaxed mt-2">
            İlaçların dijital ortamda takip edilmesi, son kullanma
            tarihlerinin izlenmesi, bildirimlerin yönetilmesi ve uygun
            durumlarda eczanelerle iletişim kurulabilmesi için tek bir
            platform sunmayı amaçlar.
          </p>

        </div>


        {/* =================================================
            MISSION
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Misyonumuz
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop'un amacı, ilaç yönetimini kullanıcılar için daha
            düzenli, anlaşılır ve erişilebilir hale getirmektir.
            Kullanıcıların ilaçlarını takip etmelerine, son kullanma
            tarihlerini zamanında fark etmelerine ve ilaç yönetimi
            konusunda daha bilinçli hareket etmelerine yardımcı olmayı
            hedefliyoruz.
          </p>

        </div>


        {/* =================================================
            VISION
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Vizyonumuz
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            İlaç yönetiminin günlük yaşamın doğal ve kolay bir parçası
            haline geldiği; kullanıcıların ilaçlarını güvenli ve bilinçli
            şekilde takip edebildiği, eczanelerle dijital olarak
            etkileşim kurabildiği sürdürülebilir bir sağlık teknolojisi
            deneyimi oluşturmak.
          </p>

        </div>


        {/* =================================================
            FEATURES
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-3">
            MedLoop ile Neler Yapabilirsin?
          </h3>

          <ul className="text-xs text-forest-700/70 leading-relaxed flex flex-col gap-3">

            <FeatureItem
              icon="💊"
              title="İlaçlarını dijital olarak takip et"
              text="İlaçlarını dijital dolabına ekleyerek düzenli şekilde görüntüle."
            />

            <FeatureItem
              icon="📷"
              title="İlaçlarını tara"
              text="İlaç kutusundaki bilgilerin otomatik olarak okunmasına yardımcı ol."
            />

            <FeatureItem
              icon="⏰"
              title="Son kullanma tarihlerini takip et"
              text="Yaklaşan veya geçmiş son kullanma tarihleri hakkında bildirim al."
            />

            <FeatureItem
              icon="🏥"
              title="Yakındaki eczaneleri keşfet"
              text="Konumuna göre uygun eczaneleri görüntüle ve yol tarifi al."
            />

            <FeatureItem
              icon="🚚"
              title="Teslimatlarını takip et"
              text="Oluşturduğun ilaç taleplerinin ve teslimatlarının durumunu takip et."
            />

            <FeatureItem
              icon="⭐"
              title="Puan ve başarılar kazan"
              text="Uygulamadaki belirli işlemlerle puan ve rozetler kazan."
            />

          </ul>

        </div>


        {/* =================================================
            SAFETY NOTICE
        ================================================== */}

        <div className="rounded-2xl p-4 bg-amber-50/80 border border-amber-200/60">

          <div className="flex items-start gap-3">

            <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
              <span className="text-base">
                ⚕️
              </span>
            </div>

            <div>

              <h3 className="text-sm font-semibold text-forest-900 mb-1">
                Önemli Bilgi
              </h3>

              <p className="text-xs text-forest-700/70 leading-relaxed">
                MedLoop bir sağlık hizmeti veya tıbbi danışmanlık
                platformu değildir. Uygulamada sunulan bilgiler ilaç
                yönetimi, kayıt ve takip amacıyla kullanılır.
                İlaç kullanımınıza ilişkin kararları doktorunuzun veya
                eczacınızın önerileri doğrultusunda vermelisiniz.
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            OCR / AI NOTICE
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Otomatik İlaç Bilgisi
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            İlaç tarama özelliği ile elde edilen bilgiler otomatik
            olarak okunabilir. Taranan bilgileri kullanmadan veya
            kaydetmeden önce ilaç ambalajı, reçete veya güvenilir
            ilaç bilgileriyle kontrol etmen önemlidir.
          </p>

        </div>


        {/* =================================================
            PRIVACY & SECURITY
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Güvenlik ve Gizlilik
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            Kişisel verilerin ve uygulama içerisinde oluşturduğun
            kayıtların korunmasına önem veriyoruz. Kamera ve konum
            gibi cihaz izinleri yalnızca ilgili özelliklerin
            kullanılabilmesi için istenir.
          </p>

          <p className="text-xs text-forest-700/70 leading-relaxed mt-2">
            Verilerinin nasıl işlendiği, saklandığı ve yönetildiği
            hakkında ayrıntılı bilgiye gizlilik belgelerimizden
            ulaşabilirsin.
          </p>

          <div className="flex flex-col mt-3 border-t border-forest-900/[0.06]">

            <button
              type="button"
              onClick={onPrivacy}
              className="flex items-center justify-between py-3 text-left"
            >

              <span className="text-xs font-semibold text-forest-700">
                Gizlilik Politikası
              </span>

              <ChevronRightIcon />

            </button>

            <div className="h-px bg-forest-900/[0.05]" />

            <button
              type="button"
              onClick={onTerms}
              className="flex items-center justify-between py-3 text-left"
            >

              <span className="text-xs font-semibold text-forest-700">
                Kullanım Koşulları
              </span>

              <ChevronRightIcon />

            </button>

          </div>

        </div>


        {/* =================================================
            ENVIRONMENT
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Çevresel Sorumluluk
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            Kullanılmayan veya süresi geçmiş ilaçların evlerde
            kontrolsüz şekilde birikmesini azaltmaya ve güvenli
            ilaç yönetimi konusunda farkındalık oluşturmaya
            katkı sağlamayı amaçlıyoruz.
          </p>

          <p className="text-xs text-forest-700/70 leading-relaxed mt-2">
            İlaçların nasıl imha edilmesi veya teslim edilmesi
            gerektiği konusunda yerel mevzuata ve yetkili sağlık
            kuruluşlarının yönlendirmelerine uyulmalıdır.
          </p>

        </div>


        {/* =================================================
            PROJECT
        ================================================== */}

        <div className="glass-card rounded-2xl p-4">

          <h3 className="text-sm font-semibold text-forest-900 mb-2">
            Proje Hakkında
          </h3>

          <p className="text-xs text-forest-700/70 leading-relaxed">
            MedLoop, dijital ilaç yönetimi alanında kullanıcı
            deneyimini geliştirmeye yönelik bir öğrenci projesi
            olarak geliştirilmektedir.
          </p>

          <p className="text-xs text-forest-700/70 leading-relaxed mt-2">
            Projenin amacı; ilaç takibini, son kullanma tarihi
            yönetimini ve eczane etkileşimini tek bir dijital
            deneyim içerisinde bir araya getirmektir.
          </p>

        </div>


        {/* =================================================
            VERSION / FOOTER
        ================================================== */}

        <div className="text-center py-2">

          <p className="font-display font-semibold text-forest-900 text-sm">
            MedLoop
          </p>

          <p className="text-[10px] text-forest-700/40 mt-1">
            Sürüm 1.0.0
          </p>

          <p className="text-[10px] text-forest-700/35 mt-1">
            © 2026 MedLoop
          </p>

          <p className="text-[9px] text-forest-700/30 mt-2">
            Daha bilinçli, daha düzenli, daha sürdürülebilir ilaç yönetimi.
          </p>

        </div>

      </div>
    </div>
  )
}


/* ============================================================
   FEATURE ITEM
============================================================ */

function FeatureItem({ icon, title, text }) {
  return (
    <li className="flex items-start gap-3">

      <span className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0 text-sm">
        {icon}
      </span>

      <div className="flex-1 min-w-0">

        <p className="font-medium text-forest-900">
          {title}
        </p>

        <p className="text-[11px] text-forest-700/55 leading-relaxed mt-0.5">
          {text}
        </p>

      </div>

    </li>
  )
}


/* ============================================================
   CHEVRON
============================================================ */

function ChevronRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-forest-700/30 shrink-0"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
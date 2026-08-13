import { useState } from 'react'

/**
 * PrivacyScreen
 *
 * Gizlilik ve güvenlik ayarlarını yönetir.
 *
 * Backend bağlantıları hazır olduğunda:
 *
 * onClearData()
 * onExportData()
 * onDeleteAccount()
 *
 * callback'leri App.jsx üzerinden gerçek API işlemlerine
 * bağlanabilir.
 */

export default function PrivacyScreen({
  onClearData,
  onBack,
  onExportData,
  onDeleteAccount,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [confirmingAccountDelete, setConfirmingAccountDelete] = useState(false)

  const [cleared, setCleared] = useState(false)
  const [exported, setExported] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState(null)

  const [showPermissions, setShowPermissions] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const [showOcrInfo, setShowOcrInfo] = useState(false)

  /*
   * Şimdilik frontend durumudur.
   *
   * Backend entegrasyonu tamamlandığında:
   * - gerçek kullanıcı izin durumu
   * - browser/device permission
   * - backend permission tercihleri
   * buraya bağlanabilir.
   */
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)

  /* ============================================================
     TÜM VERİLERİ SİL
  ============================================================ */

  const handleClearData = () => {
    /*
     * App.jsx içindeki mevcut verileri temizler.
     *
     * Backend hazır olduğunda burada API isteği
     * App.jsx üzerinden gerçekleştirilebilir.
     */
    onClearData?.()

    setConfirmingClear(false)
    setCleared(true)

    setTimeout(() => {
      setCleared(false)
    }, 2500)
  }

  /* ============================================================
     VERİLERİ DIŞA AKTAR
  ============================================================ */

  const handleExportData = async () => {
    /*
     * onExportData, App.jsx üzerinden GET /users/me/export'u çağırıp
     * dönen JSON'ı bir dosya olarak indirtir. Burada sadece sonucu
     * (başarı/hata) yönetiyoruz.
     */
    setExporting(true)
    setExportError(null)

    try {
      await onExportData?.()
      setExported(true)
      setTimeout(() => setExported(false), 2500)
    } catch (err) {
      setExportError(err?.message || 'Verileriniz dışa aktarılamadı, tekrar deneyin.')
    } finally {
      setExporting(false)
    }
  }

  /* ============================================================
     HESABI SİL
  ============================================================ */

  const handleDeleteAccount = async () => {
    /*
     * onDeleteAccount, App.jsx üzerinden DELETE /users/me'yi çağırır ve
     * başarılı olursa kısa bir süre sonra oturumu kapatıp rol seçim
     * ekranına döner (bu ekran o sırada zaten unmount olur).
     */
    setDeletingAccount(true)
    setDeleteAccountError(null)

    try {
      await onDeleteAccount?.()
      setConfirmingAccountDelete(false)
      setAccountDeleted(true)
    } catch (err) {
      setDeleteAccountError(err?.message || 'Hesap silinemedi, tekrar deneyin.')
      setDeletingAccount(false)
    }
  }

  /* ============================================================
     YASAL BELGELER
  ============================================================ */

  const openPrivacyPolicy = () => {
    window.open('/legal/privacy-policy.html', '_blank', 'noopener,noreferrer')
  }

  const openTerms = () => {
    window.open('/legal/terms-of-use.html', '_blank', 'noopener,noreferrer')
  }

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

        <div>
          <h1 className="font-display font-bold text-forest-900 text-lg">
            Gizlilik ve Güvenlik
          </h1>

          <p className="text-[11px] text-forest-700/60 mt-0.5">
            Verileriniz sizin kontrolünüzde
          </p>
        </div>

      </header>


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-12 flex flex-col gap-5">


        {/* =================================================
            INTRO
        ================================================== */}

        <div className="glass-card rounded-2xl p-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-forest-700"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>

            </div>

            <div>

              <h2 className="text-sm font-semibold text-forest-900">
                Verileriniz sizin kontrolünüzde
              </h2>

              <p className="text-xs text-forest-700/70 leading-relaxed mt-2">
                MedLoop, kişisel ve ilaçla ilişkili verilerinizin
                gizliliğini ve güvenliğini korumayı amaçlar.
                Verilerinizin nasıl kullanıldığını ve uygulama
                izinlerini bu ekrandan yönetebilirsiniz.
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            DATA STORAGE
        ================================================== */}

        <section>

          <SectionTitle title="VERİLERİNİZ" />

          <div className="glass-card rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">

              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>

              <div>

                <h2 className="text-sm font-semibold text-forest-900">
                  Verileriniz nerede saklanıyor?
                </h2>

                <p className="text-[11px] text-forest-700/50 mt-0.5">
                  Veri saklama ve işleme
                </p>

              </div>

            </div>


            <p className="text-xs text-forest-700/70 leading-relaxed">

              MedLoop'u kullanırken oluşturduğunuz ilaç,
              teslimat, profil ve uygulama tercihleri gibi
              veriler backend sunucularında saklanabilir.

              Uygulamanın çalışması için gerekli bazı bilgiler
              cihazınızda da geçici olarak tutulabilir.

            </p>


            <div className="mt-4 rounded-xl bg-white/50 p-3">

              <p className="text-[11px] text-forest-700/65 leading-relaxed">

                Verileriniz, MedLoop'un sunduğu özellikleri
                sağlayabilmek, hesabınızı yönetmek ve uygulama
                deneyiminizi geliştirmek amacıyla işlenir.

              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            APP PERMISSIONS
        ================================================== */}

        <section>

          <SectionTitle title="UYGULAMA İZİNLERİ" />

          <div className="glass-card rounded-2xl overflow-hidden">

            <PermissionRow
              icon="📍"
              title="Konum"
              description="Yakındaki eczaneleri göstermek ve mesafe hesaplamak için kullanılır."
              enabled={locationEnabled}
              onToggle={() => setLocationEnabled((prev) => !prev)}
            />

            <div className="h-px bg-forest-900/5 mx-4" />

            <PermissionRow
              icon="📷"
              title="Kamera"
              description="İlaç karekodlarını ve ilaç bilgilerini taramak için kullanılır."
              enabled={cameraEnabled}
              onToggle={() => setCameraEnabled((prev) => !prev)}
            />

          </div>


          <button
            type="button"
            onClick={() => setShowPermissions(true)}
            className="w-full text-left mt-3 glass-card rounded-xl px-4 py-3 flex items-center justify-between"
          >

            <div>

              <p className="text-xs font-semibold text-forest-900">
                İzinler hakkında daha fazla bilgi
              </p>

              <p className="text-[11px] text-forest-700/55 mt-0.5">
                MedLoop bu izinleri neden kullanıyor?
              </p>

            </div>

            <span className="text-forest-700">
              →
            </span>

          </button>

        </section>


        {/* =================================================
            OCR / AI
        ================================================== */}

        <section>

          <SectionTitle title="İLAÇ TARAMA VE OCR" />

          <div className="glass-card rounded-2xl p-5">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                <span className="text-lg">🤖</span>
              </div>

              <div className="flex-1">

                <h2 className="text-sm font-semibold text-forest-900">
                  Otomatik ilaç bilgisi çıkarımı
                </h2>

                <p className="text-xs text-forest-700/70 leading-relaxed mt-2">

                  İlaç Tara özelliği ile taranan görüntüler,
                  ilaç bilgilerinin otomatik olarak algılanması
                  ve hesabınıza kaydedilmesi amacıyla işlenebilir.

                </p>

              </div>

            </div>


            <div className="mt-4 rounded-xl bg-amber-50/80 border border-amber-200/60 p-3">

              <div className="flex items-start gap-2">

                <span className="text-sm">
                  ⚠️
                </span>

                <p className="text-[11px] text-amber-900/75 leading-relaxed">

                  Taranan bilgiler otomatik olarak okunmuştur.
                  Kullanmadan önce ambalaj veya reçete bilgileriyle
                  kontrol edin.

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() => setShowOcrInfo(true)}
              className="mt-3 text-xs font-semibold text-forest-700"
            >
              OCR ve veri işleme hakkında daha fazla bilgi →
            </button>

          </div>

        </section>


        {/* =================================================
            DATA PERMISSIONS
        ================================================== */}

        <section>

          <SectionTitle title="VERİ İZİNLERİ" />

          <div className="glass-card rounded-2xl p-5">

            <DataPermission
              title="İlaç verileri"
              description="İlaçlarınızı kaydetmek ve takip etmek için."
            />

            <DataPermission
              title="Teslimat verileri"
              description="Eczane teslimatlarını gerçekleştirmek ve geçmişinizi göstermek için."
            />

            <DataPermission
              title="Profil bilgileri"
              description="Hesabınızı oluşturmak ve yönetmek için."
            />

            <DataPermission
              title="Bildirim tercihleri"
              description="Uygulama bildirimlerini yönetebilmek için."
            />

            <DataPermission
              title="Konum bilgisi"
              description="Yakındaki eczaneleri gösterebilmek için."
            />

            <DataPermission
              title="Kamera"
              description="İlaç tarama özelliğini kullanabilmek için."
              last
            />

          </div>

        </section>


        {/* =================================================
            DATA MANAGEMENT
        ================================================== */}

        <section>

          <SectionTitle title="VERİLERİNİZİ YÖNETİN" />

          <div className="glass-card rounded-2xl overflow-hidden">

            <ActionRow
              icon="📤"
              title="Verilerimi dışa aktar"
              description={exportError || 'MedLoop hesabınızda kayıtlı verilerinizin bir kopyasını talep edin.'}
              descriptionClassName={exportError ? 'text-rose-500' : undefined}
              onClick={handleExportData}
              disabled={exporting}
              loading={exporting}
              success={exported}
              successText="Verileriniz indirildi ✓"
            />


            <div className="h-px bg-forest-900/5 mx-4" />


            <div className="p-5">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">
                    🗑️
                  </span>
                </div>

                <div>

                  <h2 className="text-sm font-semibold text-forest-900">
                    Tüm verilerimi sil
                  </h2>

                  <p className="text-xs text-forest-700/60 leading-relaxed mt-1">

                    İlaç kayıtlarınız, teslimat geçmişiniz,
                    bildirim geçmişiniz, puanlarınız ve başarılarınız
                    kalıcı olarak silinir.

                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="w-full h-11 rounded-xl bg-rose-500 text-white text-sm font-semibold mt-4"
              >

                {cleared
                  ? 'Verileriniz silindi ✓'
                  : 'Tüm Verilerimi Sil'}

              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            ACCOUNT DELETE
        ================================================== */}

        <section>

          <SectionTitle title="HESAP" />

          <div className="glass-card rounded-2xl p-5 border border-rose-200/50">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <span className="text-lg">
                  ⚠️
                </span>
              </div>

              <div>

                <h2 className="text-sm font-semibold text-forest-900">
                  Hesabımı sil
                </h2>

                <p className="text-xs text-forest-700/60 leading-relaxed mt-1">

                  MedLoop hesabınızı ve hesabınızla ilişkili
                  verileri kalıcı olarak silme talebinde
                  bulunabilirsiniz.

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() => setConfirmingAccountDelete(true)}
              className="w-full mt-4 h-11 rounded-xl border border-rose-300 bg-white/50 text-rose-600 text-sm font-semibold"
            >

              {accountDeleted
                ? 'Hesap silme işlemi başlatıldı'
                : 'Hesabımı Sil'}

            </button>

          </div>

        </section>


        {/* =================================================
            SECURITY
        ================================================== */}

        <section>

          <SectionTitle title="GÜVENLİK" />

          <button
            type="button"
            onClick={() => setShowSecurity(true)}
            className="w-full text-left glass-card rounded-2xl p-5"
          >

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
                <span className="text-lg">
                  🛡️
                </span>
              </div>

              <div className="flex-1">

                <h2 className="text-sm font-semibold text-forest-900">
                  Veri güvenliği
                </h2>

                <p className="text-xs text-forest-700/60 mt-1">

                  Verilerinizin güvenliği ve hesap güvenliği
                  hakkında bilgi edinin.

                </p>

              </div>

              <span className="text-forest-700">
                →
              </span>

            </div>

          </button>

        </section>


        {/* =================================================
            LEGAL
        ================================================== */}

        <section>

          <SectionTitle title="GİZLİLİK VE YASAL BELGELER" />

          <div className="glass-card rounded-2xl overflow-hidden">

            <LegalRow
              icon="📄"
              title="Gizlilik Politikası"
              description="Verilerinizin nasıl toplandığını ve işlendiğini öğrenin."
              onClick={openPrivacyPolicy}
            />


            <LegalRow
              icon="📋"
              title="Kullanım Koşulları"
              description="MedLoop kullanım şartlarını inceleyin."
              onClick={openTerms}
              last
            />

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================== */}

        <div className="text-center pt-2 pb-4">

          <p className="text-[10px] text-forest-700/40">
            MedLoop
          </p>

          <p className="text-[10px] text-forest-700/35 mt-1">
            Gizlilik ve veri güvenliği
          </p>

        </div>

      </div>


      {/* =====================================================
          DELETE ALL DATA MODAL
      ====================================================== */}

      {confirmingClear && (

        <div
          className="absolute inset-0 z-50 bg-forest-900/40 backdrop-blur-sm flex items-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-data-title"
        >

          <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-xl">

            <div className="w-12 h-1 rounded-full bg-forest-900/10 mx-auto mb-1" />

            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <span className="text-xl">
                🗑️
              </span>
            </div>

            <h2
              id="clear-data-title"
              className="font-display font-bold text-forest-900 text-lg"
            >
              Tüm verilerin silinsin mi?
            </h2>

            <p className="text-sm text-forest-700/70 leading-relaxed">

              İlaç kayıtların, teslimat geçmişin, bildirimlerin,
              puanların ve başarıların kalıcı olarak silinecek.
              Bu işlem geri alınamaz.

            </p>

            <div className="flex gap-3 mt-2">

              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="flex-1 h-12 rounded-xl bg-white/80 text-forest-700 font-medium"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleClearData}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold"
              >
                Evet, Sil
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          ACCOUNT DELETE MODAL
      ====================================================== */}

      {confirmingAccountDelete && (

        <div
          className="absolute inset-0 z-50 bg-forest-900/40 backdrop-blur-sm flex items-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >

          <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-xl">

            <div className="w-12 h-1 rounded-full bg-forest-900/10 mx-auto mb-1" />

            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <span className="text-xl">
                ⚠️
              </span>
            </div>

            <h2
              id="delete-account-title"
              className="font-display font-bold text-forest-900 text-lg"
            >
              Hesabını silmek istediğine emin misin?
            </h2>

            <p className="text-sm text-forest-700/70 leading-relaxed">

              Hesabın ve hesabınla ilişkili veriler kalıcı olarak
              silinebilir. Bu işlem geri alınamaz.

            </p>

            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">

              <p className="text-xs text-rose-800/70 leading-relaxed">

                Hesabını silmeden önce verilerini dışa aktarmak
                isteyebilirsin.

              </p>

            </div>

            {deleteAccountError && (
              <p className="text-xs text-rose-500 font-medium">
                {deleteAccountError}
              </p>
            )}

            <div className="flex gap-3 mt-2">

              <button
                type="button"
                onClick={() => setConfirmingAccountDelete(false)}
                disabled={deletingAccount}
                className="flex-1 h-12 rounded-xl bg-white/80 text-forest-700 font-medium disabled:opacity-60"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold disabled:opacity-70"
              >
                {deletingAccount ? 'Siliniyor…' : 'Hesabımı Sil'}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          PERMISSIONS INFO MODAL
      ====================================================== */}

      {showPermissions && (

        <InfoModal
          title="Uygulama izinleri"
          icon="🔐"
          onClose={() => setShowPermissions(false)}
        >

          <p>
            MedLoop bazı özelliklerini kullanabilmek için
            cihazınızdan izin isteyebilir.
          </p>

          <InfoItem
            icon="📍"
            title="Konum"
            text="Yakındaki eczaneleri göstermek ve mesafe bilgisi sunmak için kullanılır."
          />

          <InfoItem
            icon="📷"
            title="Kamera"
            text="İlaç karekodlarını ve ilaç bilgilerini taramak için kullanılır."
          />

          <p className="pt-2">

            Bu izinleri cihazınızın veya tarayıcınızın ayarlarından
            istediğiniz zaman değiştirebilirsiniz.

          </p>

        </InfoModal>

      )}


      {/* =====================================================
          OCR INFO MODAL
      ====================================================== */}

      {showOcrInfo && (

        <InfoModal
          title="OCR ve ilaç tarama"
          icon="🤖"
          onClose={() => setShowOcrInfo(false)}
        >

          <p>

            İlaç Tara özelliği, kamerayla taradığınız görüntülerden
            ilaçla ilgili bilgileri otomatik olarak algılamaya
            yardımcı olur.

          </p>

          <InfoItem
            icon="📷"
            title="Görüntü"
            text="Tarama işlemi sırasında kamera görüntüsü alınabilir."
          />

          <InfoItem
            icon="🤖"
            title="Otomatik okuma"
            text="Görüntüdeki bilgiler OCR/AI teknolojileri kullanılarak işlenebilir."
          />

          <InfoItem
            icon="💊"
            title="Kontrol"
            text="Otomatik olarak çıkarılan bilgileri kullanmadan önce ambalaj veya reçete bilgileriyle karşılaştırın."
          />

          <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 mt-2">

            <p className="text-[11px] text-amber-900/75 leading-relaxed">

              Otomatik tarama sonucu tıbbi tavsiye veya doktor
              önerisi yerine geçmez.

            </p>

          </div>

        </InfoModal>

      )}


      {/* =====================================================
          SECURITY INFO MODAL
      ====================================================== */}

      {showSecurity && (

        <InfoModal
          title="Veri güvenliği"
          icon="🛡️"
          onClose={() => setShowSecurity(false)}
        >

          <p>

            MedLoop, kişisel ve ilaçla ilişkili verilerinizin
            güvenliğini korumak için uygun teknik ve idari
            güvenlik önlemlerinin kullanılmasını hedefler.

          </p>

          <InfoItem
            icon="🔐"
            title="Hesap güvenliği"
            text="Hesabınıza erişimi korumak için kullanılan kimlik doğrulama mekanizmaları backend altyapısıyla birlikte yönetilir."
          />

          <InfoItem
            icon="📦"
            title="Veri yönetimi"
            text="Kayıtlı verilerinizi görüntüleme, dışa aktarma ve silme seçeneklerine sahip olabilirsiniz."
          />

          <InfoItem
            icon="⚙️"
            title="İzin kontrolü"
            text="Konum ve kamera gibi cihaz izinlerini cihaz veya tarayıcı ayarlarınızdan yönetebilirsiniz."
          />

        </InfoModal>

      )}

    </div>
  )
}


/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({ title }) {
  return (
    <h2 className="text-[10px] font-bold tracking-wider text-forest-700/45 px-1 mb-2">
      {title}
    </h2>
  )
}


/* ============================================================
   PERMISSION ROW
============================================================ */

function PermissionRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="p-4 flex items-center gap-3">

      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        <span className="text-lg">
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">

        <h3 className="text-sm font-semibold text-forest-900">
          {title}
        </h3>

        <p className="text-[11px] text-forest-700/55 leading-relaxed mt-1">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={`${title} iznini ${enabled ? 'kapat' : 'aç'}`}
        aria-pressed={enabled}
        className={`w-11 h-6 rounded-full p-1 shrink-0 transition-colors ${
          enabled
            ? 'bg-forest-600'
            : 'bg-forest-900/15'
        }`}
      >

        <span
          className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled
              ? 'translate-x-5'
              : 'translate-x-0'
          }`}
        />

      </button>

    </div>
  )
}


/* ============================================================
   DATA PERMISSION
============================================================ */

function DataPermission({
  title,
  description,
  last = false,
}) {
  return (
    <div
      className={`flex items-start gap-3 py-3 ${
        !last ? 'border-b border-forest-900/5' : ''
      }`}
    >

      <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center shrink-0 mt-0.5">

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-forest-700"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>

      </div>

      <div>

        <p className="text-xs font-semibold text-forest-900">
          {title}
        </p>

        <p className="text-[11px] text-forest-700/55 mt-0.5 leading-relaxed">
          {description}
        </p>

      </div>

    </div>
  )
}


/* ============================================================
   ACTION ROW
============================================================ */

function ActionRow({
  icon,
  title,
  description,
  descriptionClassName,
  onClick,
  disabled = false,
  loading = false,
  success,
  successText,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-5 flex items-center gap-3 disabled:opacity-60"
    >

      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        <span className="text-lg">
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">

        <h3 className="text-sm font-semibold text-forest-900">
          {loading ? 'Hazırlanıyor…' : success ? successText : title}
        </h3>

        <p className={`text-[11px] leading-relaxed mt-1 ${descriptionClassName || 'text-forest-700/55'}`}>
          {description}
        </p>

      </div>

      <span className="text-forest-700 shrink-0">
        {loading ? '…' : success ? '✓' : '→'}
      </span>

    </button>
  )
}


/* ============================================================
   LEGAL ROW
============================================================ */

function LegalRow({
  icon,
  title,
  description,
  onClick,
  last = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 flex items-center gap-3 ${
        !last ? 'border-b border-forest-900/5' : ''
      }`}
    >

      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        <span className="text-lg">
          {icon}
        </span>
      </div>

      <div className="flex-1">

        <h3 className="text-sm font-semibold text-forest-900">
          {title}
        </h3>

        <p className="text-[11px] text-forest-700/55 mt-1 leading-relaxed">
          {description}
        </p>

      </div>

      <span className="text-forest-700">
        →
      </span>

    </button>
  )
}


/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-start gap-3 py-2">

      <span className="text-base">
        {icon}
      </span>

      <div>

        <p className="text-xs font-semibold text-forest-900">
          {title}
        </p>

        <p className="text-[11px] text-forest-700/60 leading-relaxed mt-1">
          {text}
        </p>

      </div>

    </div>
  )
}


/* ============================================================
   INFO MODAL
============================================================ */

function InfoModal({
  title,
  icon,
  children,
  onClose,
}) {
  return (
    <div
      className="absolute inset-0 z-50 bg-forest-900/40 backdrop-blur-sm flex items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >

      <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-xl max-h-[85%]">

        <div className="w-12 h-1 rounded-full bg-forest-900/10 mx-auto" />

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-2xl bg-forest-100 flex items-center justify-center">

            <span className="text-lg">
              {icon}
            </span>

          </div>

          <h2
            id="info-modal-title"
            className="font-display font-bold text-forest-900 text-lg"
          >
            {title}
          </h2>

        </div>

        <div className="overflow-y-auto text-xs text-forest-700/70 leading-relaxed space-y-3">
          {children}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-forest-700 text-white text-sm font-semibold mt-2"
        >
          Anladım
        </button>

      </div>

    </div>
  )
}
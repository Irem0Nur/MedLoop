import { useMemo, useState } from 'react'

const FAQ_CATEGORIES = [
  {
    id: 'medicine',
    title: 'İlaç & Tarama',
    icon: '💊',
    description: 'İlaç ekleme, tarama ve son kullanma tarihi',
  },
  {
    id: 'pharmacy',
    title: 'Eczane & Teslimat',
    icon: '🏥',
    description: 'Eczaneler, ilaç talepleri ve teslimatlar',
  },
  {
    id: 'account',
    title: 'Hesap & Gizlilik',
    icon: '🔐',
    description: 'Hesap, izinler ve kişisel veriler',
  },
  {
    id: 'medloop',
    title: 'MedLoop & Puan',
    icon: '⭐',
    description: 'Puanlar, başarılar ve bildirimler',
  },
]

const FAQ = [
  {
    id: 'scan',
    category: 'medicine',
    q: 'İlaç taraması nasıl çalışır?',
    a: 'Ana sayfadaki "İlaç Tara" butonuna dokun, ilaç kutusunu çerçeve içine getir ve tarama işlemini başlat. Tanınan bilgiler otomatik olarak forma doldurulabilir. İlacı kaydetmeden önce bilgileri mutlaka kontrol edip gerekiyorsa düzenleyebilirsin.',
  },
  {
    id: 'ocr',
    category: 'medicine',
    q: 'Taranan ilaç bilgileri doğru mu?',
    a: 'İlaç bilgileri OCR/AI teknolojileri kullanılarak otomatik olarak okunabilir. Otomatik çıkarılan bilgileri kullanmadan önce ilaç ambalajı veya reçete bilgileriyle karşılaştırman gerekir.',
  },
  {
    id: 'add-medicine',
    category: 'medicine',
    q: 'İlacımı nasıl eklerim?',
    a: 'Ana sayfadaki ilaç ekleme veya "İlaç Tara" özelliğini kullanabilirsin. Taramadan sonra oluşan bilgileri kontrol ederek ilacı dolabına kaydedebilirsin.',
  },
  {
    id: 'delete-medicine',
    category: 'medicine',
    q: 'İlacımı nasıl silebilirim?',
    a: 'İlaç dolabından silmek istediğin ilacı açarak ilgili silme seçeneğini kullanabilirsin. Silme işlemi uygulamanın mevcut veri yönetimi kurallarına göre gerçekleştirilir.',
  },
  {
    id: 'expiry',
    category: 'medicine',
    q: 'Son kullanma tarihi uyarılarını nasıl yönetirim?',
    a: 'Profil > Bildirim Ayarları bölümünden yaklaşan son kullanma tarihi ve süresi geçen ilaç bildirimlerini ayrı ayrı yönetebilirsin.',
  },

  {
    id: 'nearby-pharmacy',
    category: 'pharmacy',
    q: 'Yakındaki eczaneler nasıl bulunuyor?',
    a: 'Yakındaki eczaneleri göstermek için cihazının veya tarayıcının konum bilgisi kullanılabilir. Konum iznini istediğin zaman cihaz veya tarayıcı ayarlarından değiştirebilirsin.',
  },
  {
    id: 'pharmacy-request',
    category: 'pharmacy',
    q: 'Eczaneden nasıl ilaç talep edilir?',
    a: 'Uygulamadaki uygun eczane ve ilaç seçeneklerinden ilerleyerek ilaç talebi oluşturabilirsin. Talebin durumu ilgili teslimat ekranından takip edilebilir.',
  },
  {
    id: 'delivery-status',
    category: 'pharmacy',
    q: 'Teslimat durumumu nereden takip ederim?',
    a: 'Oluşturduğun ilaç taleplerinin ve teslimatlarının durumunu ilgili teslimat bölümünden takip edebilirsin. Durum bilgileri eczane ve backend sisteminden gelen güncel bilgilere göre gösterilir.',
  },
  {
    id: 'delivery-history',
    category: 'pharmacy',
    q: 'Teslimat geçmişimi nasıl görüntülerim?',
    a: 'Teslimat geçmişi bölümünden daha önce oluşturduğun teslimat ve ilaç taleplerini görüntüleyebilirsin.',
  },
  {
    id: 'cancel-delivery',
    category: 'pharmacy',
    q: 'İlaç talebimi veya teslimatımı nasıl iptal ederim?',
    a: 'İptal işlemi talebin mevcut durumuna ve eczanenin süreçlerine bağlı olabilir. İptal seçeneği görünüyorsa ilgili teslimat detayından işlemi başlatabilirsin.',
  },

  {
    id: 'data-security',
    category: 'account',
    q: 'Verilerim güvende mi?',
    a: 'MedLoop, kişisel ve ilaçla ilişkili verilerin güvenliğini korumayı amaçlar. Verilerinin nasıl işlendiği, hangi izinlerin kullanıldığı ve veri yönetimi seçenekleri için Profil > Gizlilik bölümünü inceleyebilirsin.',
  },
  {
    id: 'data-storage',
    category: 'account',
    q: 'Verilerim nerede saklanıyor?',
    a: 'MedLoop hesabınla ilişkili veriler backend altyapısında saklanabilir. Hangi verilerin saklandığı ve nasıl işlendiği hakkında daha ayrıntılı bilgi için Profil > Gizlilik bölümünü ve Gizlilik Politikası belgesini inceleyebilirsin.',
  },
  {
    id: 'export-data',
    category: 'account',
    q: 'Verilerimi nasıl dışa aktarırım?',
    a: 'Profil > Gizlilik bölümündeki "Verilerimi dışa aktar" seçeneğini kullanarak hesabınla ilişkili verilerin bir kopyasını talep edebilirsin.',
  },
  {
    id: 'delete-account',
    category: 'account',
    q: 'Hesabımı nasıl silebilirim?',
    a: 'Profil > Gizlilik bölümündeki hesap silme seçeneğinden hesap silme işlemini başlatabilirsin. Hesap silme işlemi geri alınamayabileceği için onaylamadan önce bilgilerini dışa aktarmanı öneririz.',
  },
  {
    id: 'permissions',
    category: 'account',
    q: 'Konum ve kamera izinlerini nasıl yönetirim?',
    a: 'MedLoop gerekli durumlarda konum veya kamera izni isteyebilir. Bu izinleri cihazının veya tarayıcının ayarlarından istediğin zaman değiştirebilirsin.',
  },

  {
    id: 'points',
    category: 'medloop',
    q: 'MedLoop puanını nasıl kazanırım?',
    a: 'Uygulamadaki belirli işlemleri tamamlayarak MedLoop puanı kazanabilirsin. Kazandığın puanları ve başarılarını Profil > Başarılarım bölümünden takip edebilirsin.',
  },
  {
    id: 'achievements',
    category: 'medloop',
    q: 'Başarıları nasıl kazanırım?',
    a: 'MedLoop içerisindeki belirli görevleri ve işlemleri tamamladığında başarı veya rozet kazanabilirsin. Kazandığın başarıları Profil > Başarılarım bölümünden görüntüleyebilirsin.',
  },
  {
    id: 'notifications',
    category: 'medloop',
    q: 'Bildirimleri nasıl yönetirim?',
    a: 'Profil > Bildirim Ayarları bölümünden ilaç ve uygulama bildirimlerini tercihlerin doğrultusunda yönetebilirsin.',
  },
]

export default function HelpSupportScreen({
  onBack,
  onSubmitTicket,
  onSubmitBug,
  onSubmitSuggestion,
}) {
  const [openId, setOpenId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showBugForm, setShowBugForm] = useState(false)
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)

  const [ticketText, setTicketText] = useState('')
  const [bugText, setBugText] = useState('')
  const [suggestionText, setSuggestionText] = useState('')

  const [submittedType, setSubmittedType] = useState(null)

  const filteredFAQ = useMemo(() => {
  const normalizedSearch = search
    .trim()
    .toLocaleLowerCase('tr-TR')

  return FAQ.filter((item) => {
    // Kategori filtresi
    const matchesCategory =
      !selectedCategory ||
      item.category === selectedCategory

    // Arama yapılmıyorsa sadece kategoriye göre filtrele
    if (!normalizedSearch) {
      return matchesCategory
    }

    // Kategori adını da aramaya dahil et
    const category = FAQ_CATEGORIES.find(
      (cat) => cat.id === item.category
    )

    const searchableText = [
      item.q,
      item.a,
      category?.title || '',
      category?.description || '',
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')

    // Aranan kelime/ifade soru veya cevapta bulunuyor mu?
    const matchesSearch =
      searchableText.includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })
}, [search, selectedCategory])

  const toggleFAQ = (id) => {
    setOpenId((current) => (current === id ? null : id))
  }

  const handleTicketSubmit = (event) => {
    event.preventDefault()

    const value = ticketText.trim()

    if (!value) return

    onSubmitTicket?.({
      type: 'support',
      message: value,
      createdAt: new Date().toISOString(),
    })

    setTicketText('')
    setShowTicketForm(false)
    showSuccess('ticket')
  }

  const handleBugSubmit = (event) => {
    event.preventDefault()

    const value = bugText.trim()

    if (!value) return

    onSubmitBug?.({
      type: 'bug',
      message: value,
      createdAt: new Date().toISOString(),
    })

    setBugText('')
    setShowBugForm(false)
    showSuccess('bug')
  }

  const handleSuggestionSubmit = (event) => {
    event.preventDefault()

    const value = suggestionText.trim()

    if (!value) return

    onSubmitSuggestion?.({
      type: 'suggestion',
      message: value,
      createdAt: new Date().toISOString(),
    })

    setSuggestionText('')
    setShowSuggestionForm(false)
    showSuccess('suggestion')
  }

  const showSuccess = (type) => {
    setSubmittedType(type)

    setTimeout(() => {
      setSubmittedType(null)
    }, 2500)
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
            Yardım & Destek
          </h1>

          <p className="text-[11px] text-forest-700/55 mt-0.5">
            Aradığın cevabı bulmana yardımcı olalım
          </p>
        </div>

      </header>


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-12 flex flex-col gap-6">

        {/* =================================================
            SEARCH
        ================================================== */}

        <section>

          <div className="glass-card rounded-2xl px-4 h-12 flex items-center gap-3">

            <SearchIcon />

            <input
  type="text"
  value={search}
  onChange={(event) => {
    const value = event.target.value

    setSearch(value)
    setOpenId(null)
  }}
  placeholder="Sorunuzu veya konuyu arayın..."
  aria-label="Yardım ara"
  autoComplete="off"
  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-forest-900 placeholder:text-forest-700/40"
/>

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setOpenId(null)
                }}
                aria-label="Aramayı temizle"
                className="text-forest-700/40"
              >
                <CloseIcon />
              </button>
            )}

          </div>

        </section>


        {/* =================================================
            CATEGORIES
        ================================================== */}

        <section>

          <SectionTitle>
            Yardım Konuları
          </SectionTitle>

          <div className="grid grid-cols-2 gap-3">

            {FAQ_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(
                      isSelected ? null : category.id
                    )
                    setOpenId(null)
                  }}
                  className={`glass-card rounded-2xl p-4 text-left transition ${
                    isSelected
                      ? 'ring-2 ring-forest-600/30 bg-white/80'
                      : ''
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <span className="text-xl">
                      {category.icon}
                    </span>

                    <ChevronRightIcon />

                  </div>

                  <p className="text-sm font-semibold text-forest-900 mt-3">
                    {category.title}
                  </p>

                  <p className="text-[10px] text-forest-700/55 leading-relaxed mt-1">
                    {category.description}
                  </p>

                </button>
              )
            })}

          </div>

        </section>


        {/* =================================================
            FAQ
        ================================================== */}

        <section>

          <div className="flex items-center justify-between mb-3">

            <SectionTitle>
  {search
    ? `"${search}" için sonuçlar`
    : selectedCategory
      ? 'Kategori Soruları'
      : 'Sık Sorulan Sorular'}
</SectionTitle>

            {(search || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory(null)
                  setOpenId(null)
                }}
                className="text-[10px] font-semibold text-forest-700"
              >
                Temizle
              </button>
            )}

          </div>

          <div className="glass-card rounded-2xl overflow-hidden">

            {filteredFAQ.length > 0 ? (
              filteredFAQ.map((item, index) => {

                const isOpen = openId === item.id

                return (
                  <div
                    key={item.id}
                    className={
                      index < filteredFAQ.length - 1
                        ? 'border-b border-forest-900/[0.06]'
                        : ''
                    }
                  >

                    <button
                      type="button"
                      onClick={() => toggleFAQ(item.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
                    >

                      <span className="text-sm font-medium text-forest-900">
                        {item.q}
                      </span>

                      <span
                        className={`text-forest-700/40 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDownIcon />
                      </span>

                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4">

                        <p className="text-xs text-forest-700/70 leading-relaxed">
                          {item.a}
                        </p>

                      </div>
                    )}

                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center">

                <div className="w-12 h-12 rounded-2xl bg-white/70 mx-auto flex items-center justify-center">
                  <SearchIcon />
                </div>

                <p className="text-sm font-semibold text-forest-900 mt-3">
                  Sonuç bulunamadı
                </p>

                <p className="text-xs text-forest-700/55 leading-relaxed mt-1">
                  Arama kelimeni değiştirebilir veya destek ekibimize
                  ulaşabilirsin.
                </p>

                <button
                  type="button"
                  onClick={() => setShowTicketForm(true)}
                  className="mt-4 px-4 h-10 rounded-xl bg-forest-700 text-white text-xs font-semibold"
                >
                  Destek Talebi Oluştur
                </button>

              </div>
            )}

          </div>

        </section>


        {/* =================================================
            SUPPORT CTA
        ================================================== */}

        <section>

          <div className="glass-card rounded-2xl p-5">

            <div className="flex items-start gap-3">

              <div className="w-11 h-11 rounded-2xl bg-forest-100 flex items-center justify-center shrink-0">

                <span className="text-xl">
                  🆘
                </span>

              </div>

              <div>

                <h2 className="text-sm font-semibold text-forest-900">
                  Aradığın cevabı bulamadın mı?
                </h2>

                <p className="text-xs text-forest-700/60 leading-relaxed mt-1">
                  Destek ekibimize ulaşarak yaşadığın sorunu
                  bize iletebilirsin.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() => setShowTicketForm(true)}
              className="w-full h-11 rounded-xl bg-forest-700 text-white text-sm font-semibold mt-4"
            >
              Destek Talebi Oluştur
            </button>

          </div>

        </section>


        {/* =================================================
            CONTACT
        ================================================== */}

        <section>

          <SectionTitle>
            Bize Ulaş
          </SectionTitle>

          <div className="glass-card rounded-2xl overflow-hidden">

            <a
              href="mailto:destek@medloop.app?subject=MedLoop%20Destek%20Talebi"
              className="p-4 flex items-center gap-3"
            >

              <span className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                <MailIcon />
              </span>

              <div className="flex-1 min-w-0">

                <p className="text-sm font-semibold text-forest-900">
                  E-posta ile yaz
                </p>

                <p className="text-xs text-forest-700/60">
                  destek@medloop.app
                </p>

                <p className="text-[10px] text-forest-700/40 mt-1">
                  Genellikle 24 saat içinde yanıtlıyoruz.
                </p>

              </div>

              <ChevronRightIcon />

            </a>

          </div>

        </section>


        {/* =================================================
            BUG REPORT
        ================================================== */}

        <section>

          <div className="glass-card rounded-2xl overflow-hidden">

            <SupportAction
              icon="🐛"
              title="Hata bildir"
              description="Uygulamada bir sorun mu fark ettin?"
              onClick={() => setShowBugForm(true)}
              success={submittedType === 'bug'}
              successText="Hata bildirimin alındı ✓"
            />

            <div className="h-px bg-forest-900/[0.06] mx-4" />

            <SupportAction
              icon="💡"
              title="Öneri gönder"
              description="MedLoop'u geliştirmemize yardımcı ol."
              onClick={() => setShowSuggestionForm(true)}
              success={submittedType === 'suggestion'}
              successText="Önerin alındı ✓"
            />

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================== */}

        <div className="text-center pb-3">

          <p className="text-[10px] text-forest-700/35">
            Sorun devam ederse destek ekibimize ulaşabilirsin.
          </p>

        </div>

      </div>


      {/* =====================================================
          SUPPORT TICKET MODAL
      ====================================================== */}

      {showTicketForm && (
        <SupportFormModal
          title="Destek Talebi"
          icon="🆘"
          description="Yaşadığın sorunu mümkün olduğunca detaylı anlat."
          value={ticketText}
          onChange={setTicketText}
          onClose={() => setShowTicketForm(false)}
          onSubmit={handleTicketSubmit}
          submitText="Talebi Gönder"
        />
      )}


      {/* =====================================================
          BUG MODAL
      ====================================================== */}

      {showBugForm && (
        <SupportFormModal
          title="Hata Bildir"
          icon="🐛"
          description="Karşılaştığın hatayı ve mümkünse nasıl tekrar oluştuğunu anlat."
          value={bugText}
          onChange={setBugText}
          onClose={() => setShowBugForm(false)}
          onSubmit={handleBugSubmit}
          submitText="Hata Bildir"
        />
      )}


      {/* =====================================================
          SUGGESTION MODAL
      ====================================================== */}

      {showSuggestionForm && (
        <SupportFormModal
          title="Öneri Gönder"
          icon="💡"
          description="MedLoop'da görmek istediğin özellik veya geliştirmeyi bizimle paylaş."
          value={suggestionText}
          onChange={setSuggestionText}
          onClose={() => setShowSuggestionForm(false)}
          onSubmit={handleSuggestionSubmit}
          submitText="Öneriyi Gönder"
        />
      )}

    </div>
  )
}


/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
      {children}
    </h2>
  )
}


/* ============================================================
   SUPPORT ACTION
============================================================ */

function SupportAction({
  icon,
  title,
  description,
  onClick,
  success,
  successText,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 flex items-center gap-3 text-left"
    >

      <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shrink-0 text-lg">
        {icon}
      </span>

      <div className="flex-1 min-w-0">

        <p className="text-sm font-semibold text-forest-900">
          {success ? successText : title}
        </p>

        <p className="text-xs text-forest-700/60 mt-0.5">
          {description}
        </p>

      </div>

      {success ? (
        <span className="text-forest-600 font-semibold">
          ✓
        </span>
      ) : (
        <ChevronRightIcon />
      )}

    </button>
  )
}


/* ============================================================
   SUPPORT FORM MODAL
============================================================ */

function SupportFormModal({
  title,
  icon,
  description,
  value,
  onChange,
  onClose,
  onSubmit,
  submitText,
}) {
  return (
    <div
      className="absolute inset-0 z-50 bg-forest-900/40 backdrop-blur-sm flex items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-form-title"
    >

      <div className="app-shell !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-xl">

        <div className="w-12 h-1 rounded-full bg-forest-900/10 mx-auto" />

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-2xl bg-forest-100 flex items-center justify-center">
            <span className="text-xl">
              {icon}
            </span>
          </div>

          <div>

            <h2
              id="support-form-title"
              className="font-display font-bold text-forest-900 text-lg"
            >
              {title}
            </h2>

            <p className="text-[11px] text-forest-700/55 mt-0.5">
              MedLoop Destek
            </p>

          </div>

        </div>


        <p className="text-xs text-forest-700/65 leading-relaxed">
          {description}
        </p>


        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Mesajınızı buraya yazın..."
          rows={5}
          autoFocus
          className="w-full resize-none rounded-2xl bg-white/70 border border-forest-900/5 px-4 py-3 text-sm text-forest-900 placeholder:text-forest-700/35 outline-none focus:ring-2 focus:ring-forest-600/20"
        />


        <div className="flex gap-3 mt-1">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-white/80 text-forest-700 font-medium"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className="flex-1 h-12 rounded-xl bg-forest-700 text-white font-semibold disabled:opacity-40"
          >
            {submitText}
          </button>

        </div>

      </div>

    </div>
  )
}


/* ============================================================
   ICONS
============================================================ */

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}


function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
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


function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}


function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-forest-700/40 shrink-0"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}


function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}
import { useEffect, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'

const RANK_BADGE_COLOR = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400']

/**
 * @param {number} points - gerçek MedLoop puanı
 * @param {number} medicinesCount - dolaptaki gerçek ilaç sayısı
 * @param {string} themeName - Profil > Tema'da seçili temanın adı
 * @param {string|null} avatarImage - kamera/galeriden seçilmiş profil fotoğrafı (data URL)
 * @param {(image: string) => void} onAvatarChange
 * @param {() => void} onAvatarRemove
 * @param {boolean} isDarkMode - gerçek gece modu durumu (App.jsx'te <html> class'ına uygulanır)
 * @param {() => void} onToggleDarkMode
 * @param {(key: string) => void} onOpenSetting - Tema/Bildirimler/Gizlilik/Yardım/Hakkında ekranları
 * @param {() => void} onOpenAchievements
 * @param {({latitude, longitude}) => Promise<{city}>} onUpdateLocation - "Konumumu Paylaş"
 * @param {() => Promise<{city, topThree, me}>} onFetchLeaderboard - "Liderlik Tablosu"
 * @param {() => void} onLogout - rol seçim ekranına gerçekten geri döner
 */
export default function ProfileScreen({
  name,
  email,
  points,
  medicinesCount,
  totalDelivered,
  achievementsCount,
  themeName,
  avatarImage,
  onAvatarChange,
  onAvatarRemove,
  isDarkMode,
  onToggleDarkMode,
  onOpenSetting,
  onOpenAchievements,
  onUpdateName,
  onUpdateLocation,
  onFetchLeaderboard,
  onLogout,
  onNavigate,
}) {
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState(null)

  // "Liderlik Tablosu" — mount olduğunda sessizce mevcut durumu çeker
  // (kullanıcı daha önce konum paylaştıysa doğrudan tabloyu gösterir).
  const [leaderboard, setLeaderboard] = useState(null)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)

  useEffect(() => {
    onFetchLeaderboard?.()
      .then(setLeaderboard)
      .catch(() => {
        // sessizce yut — liderlik tablosu ikincil bir özellik, hata
        // profil ekranının geri kalanını etkilememeli
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShareLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Bu cihazda konum servisi desteklenmiyor.')
      return
    }
    // Tarayıcılar (özellikle Chrome) Geolocation API'sini sadece "güvenli
    // bağlamda" (https:// ya da http://localhost) çalıştırır. Uygulama
    // http://<IP-adresi>:5173 gibi bir adresten açıldıysa (ör. telefondan
    // aynı ağdaki bilgisayara erişim) izin isteği hiç gösterilmeden sessizce
    // reddedilir — bu yüzden en yaygın nedeni burada ayrıca kontrol ediyoruz.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setLocationError(
        'Konum servisi sadece güvenli bağlantılarda çalışır (https:// ya da http://localhost). ' +
          'Uygulamayı bir IP adresinden (ör. http://192.168.x.x:5173) açtıysan bu yüzden izin isteği hiç çıkmaz.'
      )
      return
    }
    setLocationError(null)
    setSharingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await onUpdateLocation?.({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          const data = await onFetchLeaderboard?.()
          setLeaderboard(data)
        } catch (err) {
          setLocationError(err?.message || 'Konum güncellenemedi, tekrar dene.')
        } finally {
          setSharingLocation(false)
        }
      },
      (geoError) => {
        // error.code: 1 = izin reddedildi, 2 = konum alınamadı (GPS/OS kapalı
        // olabilir), 3 = zaman aşımı. Her biri farklı bir eylem gerektirir,
        // bu yüzden ayrı ayrı gösteriyoruz.
        const messages = {
          1: 'Konum izni reddedildi. Tarayıcının adres çubuğundaki kilit/site ayarları simgesinden konum iznini "İzin Ver" yapıp tekrar dene.',
          2: 'Konum alınamadı. Bilgisayarının/telefonunun konum servisinin (Windows: Ayarlar > Gizlilik > Konum) açık olduğundan emin ol.',
          3: 'Konum alma zaman aşımına uğradı, tekrar dene.',
        }
        setLocationError(messages[geoError?.code] || 'Konum izni reddedildi ya da alınamadı.')
        setSharingLocation(false)
      },
      // timeout uzun tutuluyor (30sn) — özellikle bina içi/zayıf sinyalde ilk
      // konum tespiti (özellikle enableHighAccuracy: false ile, ağ/WiFi
      // tabanlı konumlama) birkaç saniyeden fazla sürebiliyor. maximumAge,
      // tarayıcının son 1 dakika içindeki bir konumu varsa onu (GPS'i tekrar
      // beklemeden) kullanmasına izin verir.
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    )
  }

  const startEditName = () => {
    setNameDraft(name || '')
    setNameError(null)
    setEditingName(true)
  }

  // Backend'e PATCH /users/me atar (bkz. App.jsx handleUpdateName). Hata
  // fırlarsa burada yakalayıp gösteriyoruz (diğer ekranlardaki gibi try/catch
  // çağıran tarafta değil, burada — çünkü düzenleme modundan çıkmadan önce
  // hatayı kullanıcıya göstermemiz gerekiyor).
  const saveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError('İsim boş olamaz')
      return
    }
    setSavingName(true)
    setNameError(null)
    try {
      await onUpdateName?.(trimmed)
      setEditingName(false)
    } catch (err) {
      setNameError(err?.message || 'İsim güncellenemedi, tekrar dene.')
    } finally {
      setSavingName(false)
    }
  }

  const settingsRows = [
    { key: 'tema', label: 'Tema', icon: <PaletteIcon />, value: themeName },
    { key: 'bildirimler', label: 'Bildirimler', icon: <BellIcon />, value: 'Açık' },
    { key: 'gizlilik', label: 'Gizlilik', icon: <LockIcon /> },
    { key: 'yardim', label: 'Yardım & Destek', icon: <HelpIcon /> },
    { key: 'hakkinda', label: 'Hakkında', icon: <InfoIcon />, value: 'v1.0.0' },
  ]

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onAvatarChange?.(reader.result)
      setAvatarSheetOpen(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="relative z-10 px-5 pt-6">
        <h1 className="font-display font-bold text-forest-900 text-xl">Profil</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 mt-5 pb-28 flex flex-col gap-5">
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarSheetOpen(true)}
              aria-label="Profil fotoğrafını değiştir"
              className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-forest-300 to-forest-600 flex items-center justify-center"
            >
              {avatarImage ? (
                <img src={avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <PersonIcon />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAvatarSheetOpen(true)}
              aria-label="Fotoğraf ekle"
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-forest-600 border-2 border-mint-50 flex items-center justify-center text-white"
            >
              <CameraIcon />
            </button>
          </div>
          {editingName ? (
            <div className="w-full flex flex-col gap-2 mt-3">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                placeholder="Adın"
                className="w-full h-11 rounded-xl px-3.5 bg-white/70 border border-mint-200 text-sm text-forest-900 text-center outline-none focus:border-forest-500 transition-colors"
              />
              {nameError && <p className="text-xs text-rose-500 font-medium">{nameError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  disabled={savingName}
                  className="flex-1 h-10 rounded-xl bg-white/80 text-forest-700 text-sm font-medium disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className="flex-1 h-10 rounded-xl bg-forest-600 text-white text-sm font-semibold disabled:opacity-70"
                >
                  {savingName ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditName}
              aria-label="İsmi düzenle"
              className="flex items-center gap-1.5 mt-3"
            >
              <h2 className="font-display font-bold text-forest-900 text-lg">{name || 'Kullanıcı'}</h2>
              <span className="text-forest-700/35 shrink-0">
                <PencilIcon />
              </span>
            </button>
          )}
          <p className="text-sm text-forest-700/60">{email}</p>

          <div className="grid grid-cols-3 gap-3 w-full mt-5">
            <StatBox value={points} label="MedLoop Puanı" />
            <StatBox value={medicinesCount} label="Toplam İlaç" />
            <StatBox value={totalDelivered} label="Toplam Teslim" />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAchievements}
          className="glass-card rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <span className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-400 shrink-0">
            <MedalIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-forest-900">Başarılarım</p>
            <p className="text-xs text-forest-700/60">{achievementsCount} başarı kazanıldı</p>
          </div>
          <ChevronIcon />
        </button>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide">
              Liderlik Tablosu
            </h3>
            {leaderboard?.city && (
              <span className="text-[11px] font-semibold text-forest-600">{leaderboard.city}</span>
            )}
          </div>

          {!leaderboard?.city ? (
            <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              <p className="text-xs text-forest-700/60">
                İlindeki liderlik tablosunu görmek için konumunu paylaş.
              </p>
              {locationError && <p className="text-xs text-rose-500 font-medium">{locationError}</p>}
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={sharingLocation}
                className="h-10 px-5 rounded-xl bg-forest-600 text-white text-sm font-semibold disabled:opacity-70"
              >
                {sharingLocation ? 'Konum alınıyor…' : 'Konumumu Paylaş'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2.5">
                {leaderboard.topThree.map((u, i) => (
                  <div key={u.id} className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${RANK_BADGE_COLOR[i]}`}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-forest-900 truncate w-full">
                      {u.name || 'Kullanıcı'}
                    </p>
                    <p className="text-[10px] text-forest-700/60">{u.points} puan</p>
                  </div>
                ))}
              </div>

              {leaderboard.me && leaderboard.me.rank > 3 && (
                <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 bg-forest-100">
                  <span className="w-7 h-7 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {leaderboard.me.rank}
                  </span>
                  <span className="flex-1 text-sm font-medium text-forest-900 truncate">
                    {leaderboard.me.name || 'Sen'}
                  </span>
                  <span className="text-sm font-semibold text-forest-700">{leaderboard.me.points} puan</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleShareLocation}
                disabled={sharingLocation}
                className="text-center text-forest-700/60 text-[11px] font-medium disabled:opacity-70"
              >
                {sharingLocation ? 'Konum güncelleniyor…' : 'Konumumu Güncelle'}
              </button>
              {locationError && <p className="text-xs text-rose-500 font-medium text-center">{locationError}</p>}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
            Ayarlar
          </h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-forest-900/[0.06]">
              <span className="text-forest-700 shrink-0">
                <MoonIcon />
              </span>
              <span className="flex-1 text-sm font-medium text-forest-900">Gece Modu</span>
              <DarkModeToggle checked={isDarkMode} onChange={onToggleDarkMode} />
            </div>

            {settingsRows.map((row, i) => (
              <button
                key={row.key}
                type="button"
                onClick={() => onOpenSetting?.(row.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                  i < settingsRows.length - 1 ? 'border-b border-forest-900/[0.06]' : ''
                }`}
              >
                <span className="text-forest-700 shrink-0">{row.icon}</span>
                <span className="flex-1 text-sm font-medium text-forest-900">{row.label}</span>
                {row.value && <span className="text-xs text-forest-700/50">{row.value}</span>}
                <ChevronIcon />
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={onLogout}
          className="glass-card rounded-2xl py-3.5 text-center text-sm font-semibold text-rose-500"
        >
          Çıkış Yap
        </button>
      </div>

      {avatarSheetOpen && (
        <div
          className="absolute inset-0 z-30 bg-forest-900/40 flex items-end"
          role="dialog"
          aria-modal="true"
          onClick={() => setAvatarSheetOpen(false)}
        >
          <div
            className="app-shell !h-auto !min-h-0 !overflow-visible bg-mint-50 rounded-t-3xl p-6 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-forest-900 text-lg mb-1">Profil Fotoğrafı</h2>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-12 rounded-xl bg-forest-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <CameraIcon /> Kameradan Çek
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full h-12 rounded-xl bg-white/80 text-forest-700 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ImageIcon /> Galeriden Seç
            </button>
            {avatarImage && (
              <button
                type="button"
                onClick={() => {
                  onAvatarRemove?.()
                  setAvatarSheetOpen(false)
                }}
                className="w-full h-12 rounded-xl bg-white/80 text-rose-500 text-sm font-semibold"
              >
                Fotoğrafı Kaldır
              </button>
            )}
            <button
              type="button"
              onClick={() => setAvatarSheetOpen(false)}
              className="w-full h-11 rounded-xl text-forest-700/60 text-sm font-medium"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFilePicked}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilePicked}
      />

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function DarkModeToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Gece modunu değiştir"
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
        checked ? 'bg-forest-600 justify-end' : 'bg-forest-900/15 justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="bg-white/60 rounded-2xl py-3 text-center">
      <p className="font-display font-bold text-forest-900 text-lg">{value}</p>
      <p className="text-[10px] font-medium text-forest-700/60 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700/30 shrink-0">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
function MedalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" /><path d="m9 3 3 5 3-5M9 9l-2-1M15 9l2-1" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2a3 3 0 0 0 3-3c0-5-3.6-8.5-8-8.5Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 1.8-2 3.3" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2h6l2 2h3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  )
}
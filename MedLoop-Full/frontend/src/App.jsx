import { useEffect, useState } from 'react'
import SplashScreen from './screens/SplashScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import RoleSelectionScreen from './screens/RoleSelectionScreen.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import RegisterScreen from './screens/RegisterScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ScanScreen from './screens/ScanScreen.jsx'
import AddMedicineScreen from './screens/AddMedicineScreen.jsx'
import MedicinesScreen from './screens/MedicinesScreen.jsx'
import MedicineDetailScreen from './screens/MedicineDetailScreen.jsx'
import NotificationsScreen from './screens/NotificationsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import AchievementsScreen from './screens/AchievementsScreen.jsx'
import NotificationSettingsScreen from './screens/NotificationSettingsScreen.jsx'
import PrivacyScreen from './screens/PrivacyScreen.jsx'
import AboutScreen from './screens/AboutScreen.jsx'
import HelpSupportScreen from './screens/HelpSupportScreen.jsx'
import ThemeScreen from './screens/ThemeScreen.jsx'
import AvatarCameraScreen from './screens/AvatarCameraScreen.jsx'
import DeliverScreen from './screens/DeliverScreen.jsx'
import DeliveryQRScreen from './screens/DeliveryQRScreen.jsx'
import PharmacistHomeScreen from './screens/PharmacistHomeScreen.jsx'
import PharmacistHistoryScreen from './screens/PharmacistHistoryScreen.jsx'
import PharmacistDeliveryDetailScreen from './screens/PharmacistDeliveryDetailScreen.jsx'
import PharmacistProfileScreen from './screens/PharmacistProfileScreen.jsx'
import PharmacistStockScreen from './screens/PharmacistStockScreen.jsx'
import PharmacistStockDetailScreen from './screens/PharmacistStockDetailScreen.jsx'
import PharmacistNotificationsScreen from './screens/PharmacistNotificationsScreen.jsx'
import PharmacistStatsScreen from './screens/PharmacistStatsScreen.jsx'
import QrScanScreen from './screens/QrScanScreen.jsx'
import DeliveryConfirmScreen from './screens/DeliveryConfirmScreen.jsx'
import { getExpiryStatus } from './utils/expiry.js'
import { ACHIEVEMENTS } from './data/achievements.js'
import { THEMES } from './data/themes.js'
import {
  authApi,
  medicationsApi,
  notificationsApi,
  deliveriesApi,
  usersApi,
  getToken,
  setToken,
} from './utils/api.js'

/**
 * Ekran akışı: splash -> onboarding -> (oturum yoksa) role -> login/register
 * -> home / pharmacist-home. Oturum açıksa (localStorage'daki token geçerliyse)
 * onboarding'den sonra doğrudan role'e göre home/pharmacist-home'a geçilir.
 *
 * GERÇEK BACKEND ENTEGRASYONU: Kimlik doğrulama (JWT), ilaçlar, bildirimler
 * ve teslim/QR akışının hepsi artık ../backend/app.py üzerindeki Flask API'ye
 * bağlı (bkz. src/utils/api.js). Puanlar sadece backend'de, bir teslimat
 * eczacı tarafından onaylandığında kazanılır (ilaç eklemek puan kazandırmaz —
 * bu, orijinal mock demodan kasıtlı bir davranış farkıdır, gerçek iş kuralına
 * uyar).
 *
 * home / medicines / scan / notifications / profile arası geçiş alt gezinme
 * çubuğu (navigateTo) ile. Eczacı tarafı kendi çubuğuna sahip
 * (pharmacistNavigateTo): pharmacist-home / pharmacist-stock /
 * pharmacist-history / pharmacist-profile. Eczacı ayrıca Ana Sayfa'dan
 * bildirimlere (pharmacist-notifications) ve istatistiklere
 * (pharmacist-stats) erişebilir.
 *
 * Gece Modu ve Tema GERÇEKTİR: <html> öğesine .dark / .theme-* class'ı
 * eklenir. Profil fotoğrafı, eczane adresi/telefonu gibi bazı alanlar
 * backend'de karşılığı olmadığı için hâlâ sadece bu oturumda (yerel) tutulur.
 * Yasal belgeler (Gizlilik Politikası / Kullanım Koşulları) public/legal/
 * altındaki statik HTML sayfaları olarak yeni sekmede açılır.
 *
 * NOT (imha/dispose akışı): handleDisposeDelivery şu an sadece istemci
 * tarafında (yerel state) çalışıyor — backend'de henüz karşılık gelen bir
 * endpoint yoksa, bir sonraki refreshDeliveries() çağrısında bu işaretleme
 * kaybolabilir. Backend'de bir "dispose" endpoint'i eklenince buranın da
 * gerçek bir API çağrısına bağlanması gerekir.
 */
export default function App() {
  const [screen, setScreen] = useState('splash')

  // --- Kimlik doğrulama ---
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  // RoleSelectionScreen'de seçilen rol; RegisterScreen'e taşınır.
  const [pendingRole, setPendingRole] = useState('citizen')
  // RoleSelectionScreen'de seçilen rol; RegisterScreen'e taşınır.
  const [pendingRole, setPendingRole] = useState('citizen')
  // Tanıtım ekranları (Onboarding) sadece kullanıcının cihazında hiç
  // görülmediyse gösterilir — bir kez tamamlandıktan sonra localStorage'a
  // işaretlenir, sonraki açılışlarda splash'tan direkt role/login'e geçilir.
  const [hasOnboarded] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('medloop-onboarded') === 'true'
  )

  // --- İlaçlar / bildirimler (backend'den) ---
  const [medicines, setMedicines] = useState([])
  const [medicinesLoading, setMedicinesLoading] = useState(false)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const [pendingScan, setPendingScan] = useState(null)
  const [activeMedicineId, setActiveMedicineId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('medloop-dark-mode') === 'true'
  )
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => new Set())
  // "achievements" ekranı hem Ana Sayfa Hızlı Erişim'den hem Profil'den
  // açılabiliyor; geri butonu doğru yere dönsün diye kaynağını tutuyoruz.
  const [achievementsOrigin, setAchievementsOrigin] = useState('home')
  // Seçili tema id'si — <html>'e THEMES içindeki className uygulanır.
  const [themeId, setThemeId] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem('medloop-theme')) || 'green'
  )
  // Kamera/galeriden seçilen profil fotoğrafı (data URL). Diğer uygulama
  // verileri gibi kalıcı depolanmıyor — sayfa yenilenince sıfırlanabilir
  // (bkz. Profil > Gizlilik açıklaması).
  const [avatarImage, setAvatarImage] = useState(null)

  // Vatandaş: QR oluşturmak için backend'den dönen teslimat kaydı (token+items).
  const [pendingDeliverySelection, setPendingDeliverySelection] = useState(null)
  // Eczacı: taranan QR'dan çözülen token (henüz onaylanmamış).
  const [pendingScannedToken, setPendingScannedToken] = useState(null)
  // Eczacının onayladığı teslimatların geçmişi (GET /deliveries).
  const [deliveries, setDeliveries] = useState([])
  const [activeDeliveryId, setActiveDeliveryId] = useState(null)
  const [deliveryDetailOrigin, setDeliveryDetailOrigin] = useState('pharmacist-home')
  const [themeOrigin, setThemeOrigin] = useState('profile')

  // Stok Detayı ekranında gösterilecek ilaç (isim anahtarı) ve hangi
  // listeden (aktif stok / imha edilenler) açıldığı — geri dönüş için.
  const [activeStockKey, setActiveStockKey] = useState(null)
  const [activeStockIsDisposedView, setActiveStockIsDisposedView] = useState(false)
  const [stockDetailOrigin, setStockDetailOrigin] = useState('pharmacist-stock')

  // Eczane profil bilgileri — adı hesaptan gelir, adres/telefon backend'de
  // karşılığı olmadığı için sadece bu oturumda tutulur.
  const [pharmacyProfile, setPharmacyProfile] = useState({
    name: 'Eczanem',
    address: 'Atatürk Cad. No:12',
    phone: '0232 123 45 67',
    pharmacistName: 'Ecz. Elif Kaya',
    workingHours: 'Pzt–Cmt 09:00–19:00',
  })

  // Bildirim Ayarları'ndaki gerçek tercihler — Bildirimler ekranını filtreler.
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    if (typeof window === 'undefined') return { soonEnabled: true, expiredEnabled: true }
    try {
      const saved = JSON.parse(localStorage.getItem('medloop-notification-prefs'))
      return saved ?? { soonEnabled: true, expiredEnabled: true }
    } catch {
      return { soonEnabled: true, expiredEnabled: true }
    }
  })

  useEffect(() => {
    localStorage.setItem('medloop-notification-prefs', JSON.stringify(notificationPrefs))
  }, [notificationPrefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('medloop-dark-mode', String(isDarkMode))
  }, [isDarkMode])

  // Seçili temanın class'ını <html>'e uygular; diğer tema class'larını temizler.
  useEffect(() => {
    THEMES.forEach((t) => t.className && document.documentElement.classList.remove(t.className))
    const theme = THEMES.find((t) => t.id === themeId)
    if (theme?.className) document.documentElement.classList.add(theme.className)
    localStorage.setItem('medloop-theme', themeId)
  }, [themeId])

  // --- Oturumu localStorage'daki token'dan geri yükle (uygulama ilk açıldığında) ---
  useEffect(() => {
    const token = getToken()
    if (!token) return
    authApi
      .me()
      .then((data) => setAuthUser(data.user))
      .catch(() => setToken(null))
  }, [])

  // Oturum (yeniden) kurulduğunda hâlâ auth ekranlarındaysak otomatik ilerle.
  useEffect(() => {
    if (authUser && ['role', 'login', 'register'].includes(screen)) {
      setScreen(authUser.role === 'pharmacist' ? 'pharmacist-home' : 'home')
    }
  }, [authUser, screen])

  // Eczacı hesabının adını eczane profiline yansıt (ilk yüklemede).
  useEffect(() => {
    if (authUser?.role === 'pharmacist' && authUser.name) {
      setPharmacyProfile((prev) => ({ ...prev, name: authUser.name }))
    }
  }, [authUser?.id, authUser?.name, authUser?.role])

  const refreshUser = async () => {
    try {
      const data = await usersApi.me()
      setAuthUser(data.user)
    } catch {
      // sessizce yut — profil bir sonraki fırsatta tekrar denenir
    }
  }

  const refreshMedications = async () => {
    setMedicinesLoading(true)
    try {
      const [activeData, deliveredData] = await Promise.all([
        medicationsApi.list(),
        medicationsApi.list('delivered'),
      ])
      setMedicines(activeData.medications.filter((m) => m.status !== 'delivered'))
      setDeliveredCount(deliveredData.medications.length)
    } catch {
      // sessizce yut
    } finally {
      setMedicinesLoading(false)
    }
  }

  const refreshNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const data = await notificationsApi.list({ limit: 100 })
      setNotifications(data.notifications)
    } catch {
      // sessizce yut
    } finally {
      setNotificationsLoading(false)
    }
  }

  const refreshDeliveries = async () => {
    try {
      const data = await deliveriesApi.history()
      setDeliveries(data.deliveries)
    } catch {
      // sessizce yut
    }
  }

  // Oturum kurulunca ilgili verileri çek.
  useEffect(() => {
    if (!authUser) return
    refreshMedications()
    refreshNotifications()
    if (authUser.role === 'pharmacist') refreshDeliveries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id])

  // Rozet kriterlerini gerçek durumla karşılaştırır; bir rozet bir kez
  // kazanıldığında sette kalıcı kalır (kriter artık sağlanmasa bile).
  useEffect(() => {
    const ctx = {
      medicines: medicines.map((m) => ({ ...m, expiryStatusKey: getExpiryStatus(m.expiryDate).key })),
      points: authUser?.points ?? 0,
      isDarkMode,
      readNotificationCount: notifications.filter((n) => n.isRead).length,
    }
    const newlyUnlocked = ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id)
    if (newlyUnlocked.some((id) => !unlockedAchievements.has(id))) {
      setUnlockedAchievements((prev) => {
        const next = new Set(prev)
        newlyUnlocked.forEach((id) => next.add(id))
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicines, authUser?.points, isDarkMode, notifications])

  const visibleNotifications = notifications.filter((n) => {
    if (n.type === 'expiry_warning_week' && !notificationPrefs.soonEnabled) return false
    if (n.type === 'expiry_warning_today' && !notificationPrefs.expiredEnabled) return false
    return true
  })
  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length

  // --- Kimlik doğrulama işlemleri ---
  const handleLogin = async (email, password) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const data = await authApi.login({ email, password })
      setToken(data.accessToken)
      setAuthUser(data.user)
    } catch (err) {
      setAuthError(err?.message || 'Giriş yapılamadı')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (payload) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const data = await authApi.register(payload)
      setToken(data.accessToken)
      setAuthUser(data.user)
    } catch (err) {
      setAuthError(err?.message || 'Kayıt oluşturulamadı')
    } finally {
      setAuthLoading(false)
    }
  }

  // Gerçek çıkış: token'ı ve tüm oturuma özel verileri temizler, rol seçim
  // ekranına döner.
  const handleLogout = () => {
    setToken(null)
    setAuthUser(null)
    setMedicines([])
    setNotifications([])
    setDeliveries([])
    setDeliveredCount(0)
    setUnlockedAchievements(new Set())
    setScreen('role')
  }

  // Alt gezinme çubuğundaki sekmeler arası geçiş; sekmeye her geçişte
  // ilgili verileri arka planda tazeler (ör. eczacı bir teslimatı
  // onayladıktan sonra vatandaşın puanı/güncel ilaç listesi görünsün).
  const navigateTo = (key) => {
    if (key === 'home') setScreen('home')
    else if (key === 'medicines') setScreen('medicines')
    else if (key === 'scan') setScreen('scan')
    else if (key === 'notifications') setScreen('notifications')
    else if (key === 'profile') setScreen('profile')
    if (['home', 'medicines', 'notifications', 'profile'].includes(key)) {
      refreshMedications()
      refreshNotifications()
      refreshUser()
    }
  }

  // Eczacı tarafının kendi alt gezinme çubuğu (Ana Sayfa / Stok / Geçmiş / Profil).
  const pharmacistNavigateTo = (key) => {
    if (key === 'home') setScreen('pharmacist-home')
    else if (key === 'stock') setScreen('pharmacist-stock')
    else if (key === 'history') setScreen('pharmacist-history')
    else if (key === 'profile') setScreen('pharmacist-profile')
    if (key === 'home' || key === 'history') refreshDeliveries()
  }

  // Yasal belgeler (public/legal/*.html) — yeni sekmede açılır.
  const openPrivacyPolicy = () => {
    window.open('/legal/privacy-policy.html', '_blank', 'noopener,noreferrer')
  }
  const openTerms = () => {
    window.open('/legal/terms-of-use.html', '_blank', 'noopener,noreferrer')
  }

  // Ana sayfadaki Hızlı Erişim kartları — bottom nav'daki sekmelerle
  // (medicines, notifications) aynı navigateTo'yu, henüz geliştirilmeyen
  // hedefler için ise placeholder ekranları kullanır.
  const handleQuickAccess = (key) => {
    if (key === 'medicines' || key === 'notifications') navigateTo(key)
    else if (key === 'deliver') setScreen('deliver')
    else if (key === 'achievements') {
      setAchievementsOrigin('home')
      setScreen('achievements')
    }
  }

  const handleMarkNotificationRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await notificationsApi.markRead(id)
    } catch {
      // sessizce yut — bir sonraki listelemede gerçek durum yine gelir
    }
  }

  const handleOpenMedicine = (medicine) => {
    setActiveMedicineId(medicine.id)
    setScreen('medicine-detail')
  }

  // Backend'e PATCH eder; hata fırlarsa MedicineDetailScreen kendi hata
  // mesajını gösterir (bu yüzden burada try/catch yok).
  const handleUpdateMedicine = async (form) => {
    const data = await medicationsApi.update(form.id, {
      name: form.name,
      dosage: form.dosage,
      form: form.form,
      quantity: form.quantity,
      batchNo: form.batchNo,
      expiryDate: form.expiryDate,
    })
    setMedicines((prev) => prev.map((m) => (m.id === data.medication.id ? data.medication : m)))
  }

  const handleDeleteMedicine = async (id) => {
    await medicationsApi.remove(id)
    setMedicines((prev) => prev.filter((m) => m.id !== id))
    setActiveMedicineId(null)
    setScreen('medicines')
  }

  const handleScanSuccess = (payload) => {
    setPendingScan(payload)
    setScreen('add-medicine')
  }

  // Manuel ilaç ekleme (kamera olmadan) — AddMedicineScreen'i boş bir taslakla
  // açar; ekran isManual moduna geçip tüm alanları elle doldurmayı sağlar.
  const handleManualAdd = () => {
    setPendingScan({ image: null, draft: null })
    setScreen('add-medicine')
  }

  // Backend'e POST eder ve gerçek (sunucu üretimli) id'li kaydı döndürür.
  // Not: image/note alanları backend şemasında yok, bu yüzden sadece bu
  // oturumda gösterim amaçlı kalır, kalıcı olarak saklanmaz.
  const handleSaveMedicine = async (form) => {
    const data = await medicationsApi.create({
      name: form.name,
      dosage: form.dosage,
      form: form.form,
      quantity: form.quantity,
      batchNo: form.batchNo,
      expiryDate: form.expiryDate,
    })
    setMedicines((prev) => [data.medication, ...prev])
    refreshNotifications()
    setPendingScan(null)
    setScreen('home')
  }

  const handleCancelAdd = () => {
    setPendingScan(null)
    setScreen('scan')
  }

  const handleOpenSetting = (key) => {
    if (key === 'tema') {
      setThemeOrigin('profile')
      return setScreen('theme')
    }
    if (key === 'bildirimler') return setScreen('notification-settings')
    if (key === 'gizlilik') return setScreen('privacy')
    if (key === 'yardim') return setScreen('help')
    if (key === 'hakkinda') return setScreen('about')
  }

  const handleTogglePref = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Vatandaş: seçilen ilaçlar için backend'de kısa ömürlü bir teslimat
  // token'ı oluşturur (DeliverScreen kendi hata durumunu gösterir, bu
  // yüzden burada try/catch yok).
  const handleGenerateQr = async (selectedMedicines) => {
    const ids = selectedMedicines.map((m) => m.id)
    const data = await deliveriesApi.create(ids)
    setPendingDeliverySelection(data.delivery)
    setScreen('delivery-qr')
  }

  const handleQrScanned = (payload) => {
    setPendingScannedToken(payload.token)
    setScreen('delivery-confirm')
  }

  // Eczacı bir teslimatı onayladığında (DeliveryConfirmScreen kendi içinde
  // backend'e POST /deliveries/<token>/confirm atar) geçmiş listesine ekler.
  const handleDeliveryConfirmed = (delivery) => {
    setDeliveries((prev) => [delivery, ...prev])
  }

  // Bir teslimatı (tek bir "parti") imhaya gönderir — o kayıt aktif stok
  // toplamından düşer, "İmha Edilenler" geçmişinde kalıcı olarak görünür.
  // NOT: Şu an sadece yerel state'i günceller (bkz. dosya başındaki not) —
  // backend'de karşılığı olan bir endpoint eklenince buraya bağlanmalı.
  const handleDisposeDelivery = (deliveryId) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, disposedAt: new Date().toISOString() } : d))
    )
  }

  // Bu cihazdaki tüm ilaçları backend'den de gerçekten siler.
  const handleClearAllData = async () => {
    await Promise.all(medicines.map((m) => medicationsApi.remove(m.id).catch(() => {})))
    setUnlockedAchievements(new Set())
    await refreshMedications()
    await refreshNotifications()
  }

  // Gizlilik ekranındaki "Verilerimi dışa aktar": backend'den hesapla
  // ilişkili tüm verilerin (profil, ilaçlar, bildirimler, teslimatlar) JSON
  // kopyasını çeker ve tarayıcıda bir dosya olarak indirtir. Hata fırlarsa
  // PrivacyScreen kendi hata mesajını gösterir (bu yüzden burada try/catch yok).
  const handleExportData = async () => {
    const data = await usersApi.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = url
    link.download = `medloop-verilerim-${stamp}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Gizlilik ekranındaki "Hesabımı sil": backend'de hesabı ve ilişkili tüm
  // verileri kalıcı olarak siler. Başarılı olursa PrivacyScreen kısa bir onay
  // gösterir; biz de az sonra gerçek çıkışı yapıp rol seçim ekranına döneriz
  // (hata durumunda handleLogout hiç çağrılmaz, PrivacyScreen hatayı gösterir).
  const handleDeleteAccount = async () => {
    await usersApi.deleteAccount()
    setTimeout(() => handleLogout(), 1200)
  }

  if (screen === 'splash') {
    return <SplashScreen onFinish={() => setScreen(hasOnboarded ? 'role' : 'onboarding')} />
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => {
          localStorage.setItem('medloop-onboarded', 'true')
          setScreen(authUser ? (authUser.role === 'pharmacist' ? 'pharmacist-home' : 'home') : 'role')
        }}
      />
    )
  }

  if (screen === 'role') {
    return (
      <RoleSelectionScreen
        onSelectRole={(selected) => {
          setPendingRole(selected)
          setAuthError(null)
          setScreen('register')
        }}
        onHaveAccount={() => {
          setAuthError(null)
          setScreen('login')
        }}
      />
    )
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onSubmit={handleLogin}
        loading={authLoading}
        error={authError}
        onBack={() => {
          setAuthError(null)
          setScreen('role')
        }}
        onGoRegister={() => {
          setAuthError(null)
          setScreen('role')
        }}
      />
    )
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        role={pendingRole}
        onSubmit={handleRegister}
        loading={authLoading}
        error={authError}
        onBack={() => {
          setAuthError(null)
          setScreen('role')
        }}
        onGoLogin={() => {
          setAuthError(null)
          setScreen('login')
        }}
      />
    )
  }

  if (screen === 'scan') {
    return (
      <ScanScreen
        onBack={() => setScreen('home')}
        onScanSuccess={handleScanSuccess}
        onManualAdd={handleManualAdd}
        onNavigate={navigateTo}
      />
    )
  }

  if (screen === 'add-medicine' && pendingScan) {
    return (
      <AddMedicineScreen
        scanResult={pendingScan}
        onSave={handleSaveMedicine}
        onCancel={handleCancelAdd}
      />
    )
  }

  if (screen === 'medicines') {
    return (
      <MedicinesScreen
        medicines={medicines}
        onOpenMedicine={handleOpenMedicine}
        onNavigate={navigateTo}
      />
    )
  }

  if (screen === 'medicine-detail') {
    const activeMedicine = medicines.find((m) => m.id === activeMedicineId)
    if (activeMedicine) {
      return (
        <MedicineDetailScreen
          medicine={activeMedicine}
          onSave={handleUpdateMedicine}
          onDelete={handleDeleteMedicine}
          onBack={() => setScreen('medicines')}
        />
      )
    }
  }

  if (screen === 'notifications') {
    return (
      <NotificationsScreen
        notifications={notifications}
        loading={notificationsLoading}
        onMarkRead={handleMarkNotificationRead}
        onNavigate={navigateTo}
        prefs={notificationPrefs}
      />
    )
  }

  if (screen === 'deliver') {
    return (
      <DeliverScreen
        medicines={medicines}
        onGenerateQr={handleGenerateQr}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'delivery-qr') {
    return (
      <DeliveryQRScreen
        delivery={pendingDeliverySelection}
        onBack={() => setScreen('deliver')}
      />
    )
  }

  if (screen === 'pharmacist-home') {
    return (
      <PharmacistHomeScreen
        deliveries={deliveries}
        pharmacyName={pharmacyProfile.name}
        onScanQr={() => setScreen('qr-scan')}
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)
          setDeliveryDetailOrigin('pharmacist-home')
          setScreen('pharmacist-delivery-detail')
        }}
        onOpenNotifications={() => setScreen('pharmacist-notifications')}
        onOpenStats={() => setScreen('pharmacist-stats')}
        onNavigate={pharmacistNavigateTo}
      />
    )
  }

  if (screen === 'pharmacist-stock') {
    return (
      <PharmacistStockScreen
        deliveries={deliveries}
        onOpenStock={(name, isDisposedView) => {
          setActiveStockKey(name)
          setActiveStockIsDisposedView(isDisposedView)
          setStockDetailOrigin('pharmacist-stock')
          setScreen('pharmacist-stock-detail')
        }}
        onNavigate={pharmacistNavigateTo}
      />
    )
  }

  if (screen === 'pharmacist-stock-detail') {
    return (
      <PharmacistStockDetailScreen
        deliveries={deliveries}
        medicineName={activeStockKey}
        isDisposedView={activeStockIsDisposedView}
        onDispose={handleDisposeDelivery}
        onBack={() => setScreen(stockDetailOrigin)}
      />
    )
  }

  if (screen === 'pharmacist-notifications') {
    return (
      <PharmacistNotificationsScreen
        deliveries={deliveries}
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)
          setDeliveryDetailOrigin('pharmacist-notifications')
          setScreen('pharmacist-delivery-detail')
        }}
        onOpenStock={(name) => {
          setActiveStockKey(name)
          setActiveStockIsDisposedView(false)
          setStockDetailOrigin('pharmacist-notifications')
          setScreen('pharmacist-stock-detail')
        }}
        onBack={() => setScreen('pharmacist-home')}
      />
    )
  }

  if (screen === 'pharmacist-stats') {
    return <PharmacistStatsScreen deliveries={deliveries} onBack={() => setScreen('pharmacist-home')} />
  }

  if (screen === 'pharmacist-history') {
    return (
      <PharmacistHistoryScreen
        deliveries={deliveries}
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)
          setDeliveryDetailOrigin('pharmacist-history')
          setScreen('pharmacist-delivery-detail')
        }}
        onNavigate={pharmacistNavigateTo}
      />
    )
  }

  if (screen === 'pharmacist-delivery-detail') {
    const delivery = deliveries.find((d) => d.id === activeDeliveryId)
    if (delivery) {
      return <PharmacistDeliveryDetailScreen delivery={delivery} onBack={() => setScreen(deliveryDetailOrigin)} />
    }
  }

  if (screen === 'pharmacist-profile') {
    const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
    const completedDeliveries = deliveries.filter((d) => d.status === 'confirmed')
    const totalMedicinesReceived = completedDeliveries.reduce((sum, d) => sum + d.items.length, 0)
    return (
      <PharmacistProfileScreen
        pharmacyProfile={pharmacyProfile}
        onUpdateProfile={setPharmacyProfile}
        themeName={currentTheme.name}
        totalDeliveries={completedDeliveries.length}
        totalMedicines={totalMedicinesReceived}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onOpenTheme={() => {
          setThemeOrigin('pharmacist-profile')
          setScreen('theme')
        }}
        onLogout={handleLogout}
        onNavigate={pharmacistNavigateTo}
      />
    )
  }

  if (screen === 'qr-scan') {
    return <QrScanScreen onScanned={handleQrScanned} onBack={() => setScreen('pharmacist-home')} />
  }

  if (screen === 'delivery-confirm' && pendingScannedToken) {
    return (
      <DeliveryConfirmScreen
        token={pendingScannedToken}
        onConfirmed={handleDeliveryConfirmed}
        onCancel={() => {
          setPendingScannedToken(null)
          setScreen('pharmacist-home')
        }}
        onDone={() => {
          setPendingScannedToken(null)
          setScreen('pharmacist-home')
        }}
      />
    )
  }

  if (screen === 'achievements') {
    return (
      <AchievementsScreen
        unlockedIds={unlockedAchievements}
        onBack={() => setScreen(achievementsOrigin)}
      />
    )
  }

  if (screen === 'profile') {
    const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
    return (
      <ProfileScreen
        name={authUser?.name}
        email={authUser?.email}
        points={authUser?.points ?? 0}
        medicinesCount={medicines.length}
        totalDelivered={deliveredCount}
        achievementsCount={unlockedAchievements.size}
        themeName={currentTheme.name}
        avatarImage={avatarImage}
        onAvatarChange={setAvatarImage}
        onAvatarRemove={() => setAvatarImage(null)}
        onOpenCamera={() => setScreen('avatar-camera')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onOpenSetting={handleOpenSetting}
        onOpenAchievements={() => {
          setAchievementsOrigin('profile')
          setScreen('achievements')
        }}
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />
    )
  }

  if (screen === 'theme') {
    return (
      <ThemeScreen
        activeThemeId={themeId}
        onSelectTheme={setThemeId}
        onBack={() => setScreen(themeOrigin)}
      />
    )
  }

  if (screen === 'avatar-camera') {
    return (
      <AvatarCameraScreen
        onCapture={(image) => {
          setAvatarImage(image)
          setScreen('profile')
        }}
        onCancel={() => setScreen('profile')}
      />
    )
  }

  if (screen === 'notification-settings') {
    return (
      <NotificationSettingsScreen
        prefs={notificationPrefs}
        onTogglePref={handleTogglePref}
        onBack={() => setScreen('profile')}
      />
    )
  }

  if (screen === 'privacy') {
    return (
      <PrivacyScreen
        onClearData={handleClearAllData}
        onExportData={handleExportData}
        onDeleteAccount={handleDeleteAccount}
        onBack={() => setScreen('profile')}
      />
    )
  }

  if (screen === 'about') {
    return <AboutScreen onBack={() => setScreen('profile')} onPrivacy={openPrivacyPolicy} onTerms={openTerms} />
  }

  if (screen === 'help') {
    return <HelpSupportScreen onBack={() => setScreen('profile')} />
  }

  if (authUser?.role === 'pharmacist') {
    return (
      <PharmacistHomeScreen
        deliveries={deliveries}
        pharmacyName={pharmacyProfile.name}
        onScanQr={() => setScreen('qr-scan')}
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)
          setDeliveryDetailOrigin('pharmacist-home')
          setScreen('pharmacist-delivery-detail')
        }}
        onOpenNotifications={() => setScreen('pharmacist-notifications')}
        onOpenStats={() => setScreen('pharmacist-stats')}
        onNavigate={pharmacistNavigateTo}
      />
    )
  }

  return (
    <HomeScreen
      medicines={medicines}
      userName={authUser?.name}
      points={authUser?.points ?? 0}
      unreadCount={unreadCount}
      onScan={() => setScreen('scan')}
      onNavigate={navigateTo}
      onQuickAccess={handleQuickAccess}
    />
  )
}

import { useEffect, useState } from 'react'
import SplashScreen from './screens/SplashScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import RoleSelectionScreen from './screens/RoleSelectionScreen.jsx'
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
import QrScanScreen from './screens/QrScanScreen.jsx'
import DeliveryConfirmScreen from './screens/DeliveryConfirmScreen.jsx'
import { getExpiryStatus } from './utils/expiry.js'
import { ACHIEVEMENTS } from './data/achievements.js'
import { THEMES } from './data/themes.js'

// Her başarılı ilaç ekleme işleminde kazanılan gerçek MedLoop puanı.
const POINTS_PER_MEDICINE = 20

// Eczacı bir teslimatı onayladığında ilaç başına kazanılan bonus puan
// (geri dönüşüm/güvenli imha teşviki — ekleme puanından daha yüksek).
const DELIVERY_POINTS_PER_MEDICINE = 30

// Demo kullanıcı adı — gerçek kimlik doğrulama olmadığı için sabit.
const CITIZEN_NAME = 'Ahmet Yılmaz'

/**
 * Ekran akışı: splash -> onboarding -> role -> home -> scan
 * -> (yalnızca başarılı taramada) add-medicine -> home
 * home / medicines / scan / notifications / profile arası geçiş alt
 * gezinme çubuğu (navigateTo) ile. Eczacı tarafı kendi çubuğuna sahip
 * (pharmacistNavigateTo): pharmacist-home / pharmacist-history / pharmacist-profile.
 * Profil > Ayarlar'daki tüm satırlar (Tema dahil) gerçek ekranlara sahiptir.
 * Gece Modu ve Tema <html> öğesine class eklenerek uygulanır.
 * Profil fotoğrafı kamera/galeriden seçilebilir.
 * Eczacı QR akışı qrcode ve jsqr ile çalışır.
 */
export default function App() {
  const [screen, setScreen] = useState('splash')
  const [pendingScan, setPendingScan] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [role, setRole] = useState(null)
  const [activeMedicineId, setActiveMedicineId] = useState(null)
  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set())
  const [points, setPoints] = useState(0)

  const [isDarkMode, setIsDarkMode] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('medloop-dark-mode') === 'true'
  )

  const [unlockedAchievements, setUnlockedAchievements] = useState(
    () => new Set()
  )

  // "achievements" ekranı hem Ana Sayfa Hızlı Erişim'den hem Profil'den
  // açılabiliyor; geri butonu doğru yere dönsün diye kaynağını tutuyoruz.
  const [achievementsOrigin, setAchievementsOrigin] = useState('home')

  // Seçili tema id'si — <html>'e THEMES içindeki className uygulanır.
  const [themeId, setThemeId] = useState(
    () =>
      (typeof window !== 'undefined' &&
        localStorage.getItem('medloop-theme')) ||
      'green'
  )

  // Kamera/galeriden seçilen profil fotoğrafı.
  const [avatarImage, setAvatarImage] = useState(null)

  // Vatandaş: QR oluşturmak için seçilen ilaçlar.
  const [pendingDeliverySelection, setPendingDeliverySelection] = useState([])

  // Eczacı: taranan ama henüz onaylanmamış teslimat QR verisi.
  const [pendingScannedDelivery, setPendingScannedDelivery] = useState(null)

  // Onaylanmış teslimatların listesi.
  const [deliveries, setDeliveries] = useState([])

  // Görüntülenecek teslimat kaydı.
  const [activeDeliveryId, setActiveDeliveryId] = useState(null)

  const [deliveryDetailOrigin, setDeliveryDetailOrigin] = useState(
    'pharmacist-home'
  )

  // Tema ekranının geri dönüş kaynağı.
  const [themeOrigin, setThemeOrigin] = useState('profile')

  // Eczane profil bilgileri.
  const [pharmacyProfile, setPharmacyProfile] = useState({
    name: 'Merkez Eczanesi',
    address: 'Atatürk Cad. No:12',
    phone: '0232 123 45 67',
  })

  // Bildirim ayarları.
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        soonEnabled: true,
        expiredEnabled: true,
      }
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem('medloop-notification-prefs')
      )

      return (
        saved ?? {
          soonEnabled: true,
          expiredEnabled: true,
        }
      )
    } catch {
      return {
        soonEnabled: true,
        expiredEnabled: true,
      }
    }
  })

  useEffect(() => {
    localStorage.setItem(
      'medloop-notification-prefs',
      JSON.stringify(notificationPrefs)
    )
  }, [notificationPrefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)

    localStorage.setItem(
      'medloop-dark-mode',
      String(isDarkMode)
    )
  }, [isDarkMode])

  // Seçili temanın class'ını <html>'e uygular.
  useEffect(() => {
    THEMES.forEach((t) => {
      if (t.className) {
        document.documentElement.classList.remove(t.className)
      }
    })

    const theme = THEMES.find((t) => t.id === themeId)

    if (theme?.className) {
      document.documentElement.classList.add(theme.className)
    }

    localStorage.setItem('medloop-theme', themeId)
  }, [themeId])

  // Rozet kriterlerini gerçek durumla karşılaştırır.
  useEffect(() => {
    const ctx = {
      medicines: medicines.map((m) => ({
        ...m,
        expiryStatusKey: getExpiryStatus(m.expiryDate).key,
      })),
      points,
      isDarkMode,
      readNotificationCount: readNotificationIds.size,
    }

    const newlyUnlocked = ACHIEVEMENTS
      .filter((a) => a.check(ctx))
      .map((a) => a.id)

    if (
      newlyUnlocked.some(
        (id) => !unlockedAchievements.has(id)
      )
    ) {
      setUnlockedAchievements((prev) => {
        const next = new Set(prev)

        newlyUnlocked.forEach((id) => {
          next.add(id)
        })

        return next
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    medicines,
    points,
    isDarkMode,
    readNotificationIds,
  ])

  const unreadCount = medicines.filter((m) => {
    const status = getExpiryStatus(m.expiryDate).key

    return (
      (status === 'expired' || status === 'soon') &&
      !readNotificationIds.has(m.id)
    )
  }).length

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigateTo = (key) => {
    if (key === 'home') {
      setScreen('home')
    } else if (key === 'medicines') {
      setScreen('medicines')
    } else if (key === 'scan') {
      setScreen('scan')
    } else if (key === 'notifications') {
      setScreen('notifications')
    } else if (key === 'profile') {
      setScreen('profile')
    }
  }

  const pharmacistNavigateTo = (key) => {
    if (key === 'home') {
      setScreen('pharmacist-home')
    } else if (key === 'history') {
      setScreen('pharmacist-history')
    } else if (key === 'profile') {
      setScreen('pharmacist-profile')
    }
  }

  // ============================================================
  // YASAL BELGELER
  // ============================================================

  /**
   * public/legal/privacy-policy.html
   *
   * Yeni sekmede açılır.
   */
  const openPrivacyPolicy = () => {
    window.open(
      '/legal/privacy-policy.html',
      '_blank',
      'noopener,noreferrer'
    )
  }

  /**
   * public/legal/terms-of-use.html
   *
   * Yeni sekmede açılır.
   */
  const openTerms = () => {
    window.open(
      '/legal/terms-of-use.html',
      '_blank',
      'noopener,noreferrer'
    )
  }

  // ============================================================
  // QUICK ACCESS
  // ============================================================

  const handleQuickAccess = (key) => {
    if (
      key === 'medicines' ||
      key === 'notifications'
    ) {
      navigateTo(key)
    } else if (key === 'deliver') {
      setScreen('deliver')
    } else if (key === 'achievements') {
      setAchievementsOrigin('home')
      setScreen('achievements')
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const handleMarkNotificationRead = (id) => {
    setReadNotificationIds(
      (prev) => new Set(prev).add(id)
    )
  }

  // ============================================================
  // MEDICINES
  // ============================================================

  const handleOpenMedicine = (medicine) => {
    setActiveMedicineId(medicine.id)
    setScreen('medicine-detail')
  }

  const handleUpdateMedicine = (updated) => {
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === updated.id ? updated : m
      )
    )
  }

  const handleDeleteMedicine = (id) => {
    setMedicines((prev) =>
      prev.filter((m) => m.id !== id)
    )

    setActiveMedicineId(null)
    setScreen('medicines')
  }

  const handleScanSuccess = (payload) => {
    setPendingScan(payload)
    setScreen('add-medicine')
  }

  // Manuel ilaç ekleme.
  const handleManualAdd = () => {
    setPendingScan({
      image: null,
      draft: null,
    })

    setScreen('add-medicine')
  }

  const handleSaveMedicine = (medicine) => {
    setMedicines((prev) => [
      medicine,
      ...prev,
    ])

    setPoints(
      (prev) => prev + POINTS_PER_MEDICINE
    )

    setPendingScan(null)
    setScreen('home')
  }

  const handleCancelAdd = () => {
    setPendingScan(null)
    setScreen('scan')
  }

  // ============================================================
  // PROFILE SETTINGS
  // ============================================================

  const handleOpenSetting = (key) => {
    if (key === 'tema') {
      setThemeOrigin('profile')
      return setScreen('theme')
    }

    if (key === 'bildirimler') {
      return setScreen('notification-settings')
    }

    if (key === 'gizlilik') {
      return setScreen('privacy')
    }

    if (key === 'yardim') {
      return setScreen('help')
    }

    if (key === 'hakkinda') {
      return setScreen('about')
    }
  }

  const handleTogglePref = (key) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // ============================================================
  // DELIVERY
  // ============================================================

  const handleGenerateQr = (selectedMedicines) => {
    setPendingDeliverySelection(selectedMedicines)
    setScreen('delivery-qr')
  }

  const handleQrScanned = (payload) => {
    setPendingScannedDelivery(payload)
    setScreen('delivery-confirm')
  }

  // Eczacı teslimatı onayladığında ilaçlar vatandaşın dolabından düşer.
  const handleConfirmDelivery = () => {
    if (!pendingScannedDelivery) {
      return
    }

    const deliveredIds = new Set(
      pendingScannedDelivery.items.map(
        (i) => i.id
      )
    )

    setMedicines((prev) =>
      prev.filter(
        (m) => !deliveredIds.has(m.id)
      )
    )

    setPoints(
      (prev) =>
        prev +
        pendingScannedDelivery.items.length *
          DELIVERY_POINTS_PER_MEDICINE
    )

    setDeliveries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        citizenName:
          pendingScannedDelivery.citizenName,
        items:
          pendingScannedDelivery.items,
        confirmedAt:
          new Date().toISOString(),
      },
    ])
  }

  // ============================================================
  // DATA CLEAR
  // ============================================================

  const handleClearAllData = () => {
    setMedicines([])
    setPoints(0)
    setReadNotificationIds(new Set())
    setUnlockedAchievements(new Set())
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    setRole(null)
    setScreen('role')
  }

  // ============================================================
  // SPLASH
  // ============================================================

  if (screen === 'splash') {
    return (
      <SplashScreen
        onFinish={() =>
          setScreen('onboarding')
        }
      />
    )
  }

  // ============================================================
  // ONBOARDING
  // ============================================================

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() =>
          setScreen('role')
        }
      />
    )
  }

  // ============================================================
  // ROLE
  // ============================================================

  if (screen === 'role') {
    return (
      <RoleSelectionScreen
        onSelectRole={(selected) => {
          setRole(selected)

          setScreen(
            selected === 'pharmacist'
              ? 'pharmacist-home'
              : 'home'
          )
        }}
        onHaveAccount={() => {
          setRole('citizen')
          setScreen('home')
        }}
      />
    )
  }

  // ============================================================
  // SCAN
  // ============================================================

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

  // ============================================================
  // ADD MEDICINE
  // ============================================================

  if (
    screen === 'add-medicine' &&
    pendingScan
  ) {
    return (
      <AddMedicineScreen
        scanResult={pendingScan}
        onSave={handleSaveMedicine}
        onCancel={handleCancelAdd}
      />
    )
  }

  // ============================================================
  // MEDICINES
  // ============================================================

  if (screen === 'medicines') {
    return (
      <MedicinesScreen
        medicines={medicines}
        onOpenMedicine={handleOpenMedicine}
        onNavigate={navigateTo}
      />
    )
  }

  // ============================================================
  // MEDICINE DETAIL
  // ============================================================

  if (screen === 'medicine-detail') {
    const activeMedicine =
      medicines.find(
        (m) => m.id === activeMedicineId
      )

    if (activeMedicine) {
      return (
        <MedicineDetailScreen
          medicine={activeMedicine}
          onSave={handleUpdateMedicine}
          onDelete={handleDeleteMedicine}
          onBack={() =>
            setScreen('medicines')
          }
        />
      )
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  if (screen === 'notifications') {
    return (
      <NotificationsScreen
        medicines={medicines}
        readIds={readNotificationIds}
        onMarkRead={
          handleMarkNotificationRead
        }
        onNavigate={navigateTo}
        prefs={notificationPrefs}
      />
    )
  }

  // ============================================================
  // DELIVER
  // ============================================================

  if (screen === 'deliver') {
    return (
      <DeliverScreen
        medicines={medicines}
        onGenerateQr={handleGenerateQr}
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  // ============================================================
  // DELIVERY QR
  // ============================================================

  if (screen === 'delivery-qr') {
    return (
      <DeliveryQRScreen
        medicines={
          pendingDeliverySelection
        }
        citizenName={CITIZEN_NAME}
        onBack={() =>
          setScreen('deliver')
        }
      />
    )
  }

  // ============================================================
  // PHARMACIST HOME
  // ============================================================

  if (screen === 'pharmacist-home') {
    return (
      <PharmacistHomeScreen
        deliveries={deliveries}
        pharmacyName={
          pharmacyProfile.name
        }
        onScanQr={() =>
          setScreen('qr-scan')
        }
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)

          setDeliveryDetailOrigin(
            'pharmacist-home'
          )

          setScreen(
            'pharmacist-delivery-detail'
          )
        }}
        onNavigate={
          pharmacistNavigateTo
        }
      />
    )
  }

  // ============================================================
  // PHARMACIST HISTORY
  // ============================================================

  if (
    screen === 'pharmacist-history'
  ) {
    return (
      <PharmacistHistoryScreen
        deliveries={deliveries}
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)

          setDeliveryDetailOrigin(
            'pharmacist-history'
          )

          setScreen(
            'pharmacist-delivery-detail'
          )
        }}
        onNavigate={
          pharmacistNavigateTo
        }
      />
    )
  }

  // ============================================================
  // PHARMACIST DELIVERY DETAIL
  // ============================================================

  if (
    screen ===
    'pharmacist-delivery-detail'
  ) {
    const delivery =
      deliveries.find(
        (d) =>
          d.id === activeDeliveryId
      )

    if (delivery) {
      return (
        <PharmacistDeliveryDetailScreen
          delivery={delivery}
          onBack={() =>
            setScreen(
              deliveryDetailOrigin
            )
          }
        />
      )
    }
  }

  // ============================================================
  // PHARMACIST PROFILE
  // ============================================================

  if (
    screen === 'pharmacist-profile'
  ) {
    const currentTheme =
      THEMES.find(
        (t) => t.id === themeId
      ) ?? THEMES[0]

    const totalMedicinesReceived =
      deliveries.reduce(
        (sum, d) =>
          sum + d.items.length,
        0
      )

    return (
      <PharmacistProfileScreen
        pharmacyProfile={
          pharmacyProfile
        }
        onUpdateProfile={
          setPharmacyProfile
        }
        themeName={
          currentTheme.name
        }
        totalDeliveries={
          deliveries.length
        }
        totalMedicines={
          totalMedicinesReceived
        }
        isDarkMode={isDarkMode}
        onToggleDarkMode={() =>
          setIsDarkMode(
            (prev) => !prev
          )
        }
        onOpenTheme={() => {
          setThemeOrigin(
            'pharmacist-profile'
          )

          setScreen('theme')
        }}
        onLogout={handleLogout}
        onNavigate={
          pharmacistNavigateTo
        }
      />
    )
  }

  // ============================================================
  // QR SCAN
  // ============================================================

  if (screen === 'qr-scan') {
    return (
      <QrScanScreen
        onScanned={handleQrScanned}
        onBack={() =>
          setScreen(
            'pharmacist-home'
          )
        }
      />
    )
  }

  // ============================================================
  // DELIVERY CONFIRM
  // ============================================================

  if (
    screen === 'delivery-confirm' &&
    pendingScannedDelivery
  ) {
    return (
      <DeliveryConfirmScreen
        payload={
          pendingScannedDelivery
        }
        onConfirm={
          handleConfirmDelivery
        }
        onCancel={() => {
          setPendingScannedDelivery(
            null
          )

          setScreen(
            'pharmacist-home'
          )
        }}
        onDone={() => {
          setPendingScannedDelivery(
            null
          )

          setScreen(
            'pharmacist-home'
          )
        }}
      />
    )
  }

  // ============================================================
  // ACHIEVEMENTS
  // ============================================================

  if (screen === 'achievements') {
    return (
      <AchievementsScreen
        unlockedIds={
          unlockedAchievements
        }
        onBack={() =>
          setScreen(
            achievementsOrigin
          )
        }
      />
    )
  }

  // ============================================================
  // PROFILE
  // ============================================================

  if (screen === 'profile') {
    const currentTheme =
      THEMES.find(
        (t) => t.id === themeId
      ) ?? THEMES[0]

    const totalDelivered =
      deliveries.reduce(
        (sum, d) =>
          sum + d.items.length,
        0
      )

    return (
      <ProfileScreen
        points={points}
        medicinesCount={
          medicines.length
        }
        totalDelivered={
          totalDelivered
        }
        achievementsCount={
          unlockedAchievements.size
        }
        themeName={
          currentTheme.name
        }
        avatarImage={avatarImage}
        onAvatarChange={
          setAvatarImage
        }
        onAvatarRemove={() =>
          setAvatarImage(null)
        }
        onOpenCamera={() =>
          setScreen(
            'avatar-camera'
          )
        }
        isDarkMode={isDarkMode}
        onToggleDarkMode={() =>
          setIsDarkMode(
            (prev) => !prev
          )
        }
        onOpenSetting={
          handleOpenSetting
        }
        onOpenAchievements={() => {
          setAchievementsOrigin(
            'profile'
          )

          setScreen(
            'achievements'
          )
        }}
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />
    )
  }

  // ============================================================
  // THEME
  // ============================================================

  if (screen === 'theme') {
    return (
      <ThemeScreen
        activeThemeId={themeId}
        onSelectTheme={setThemeId}
        onBack={() =>
          setScreen(themeOrigin)
        }
      />
    )
  }

  // ============================================================
  // AVATAR CAMERA
  // ============================================================

  if (screen === 'avatar-camera') {
    return (
      <AvatarCameraScreen
        onCapture={(image) => {
          setAvatarImage(image)
          setScreen('profile')
        }}
        onCancel={() =>
          setScreen('profile')
        }
      />
    )
  }

  // ============================================================
  // NOTIFICATION SETTINGS
  // ============================================================

  if (
    screen ===
    'notification-settings'
  ) {
    return (
      <NotificationSettingsScreen
        prefs={notificationPrefs}
        onTogglePref={
          handleTogglePref
        }
        onBack={() =>
          setScreen('profile')
        }
      />
    )
  }

  // ============================================================
  // PRIVACY
  // ============================================================

  if (screen === 'privacy') {
    return (
      <PrivacyScreen
        onClearData={
          handleClearAllData
        }
        onBack={() =>
          setScreen('profile')
        }
        onOpenPrivacyPolicy={
          openPrivacyPolicy
        }
        onOpenTerms={
          openTerms
        }
      />
    )
  }

  // ============================================================
  // ABOUT
  // ============================================================

  if (screen === 'about') {
    return (
      <AboutScreen
        onBack={() =>
          setScreen('profile')
        }
        onPrivacy={
          openPrivacyPolicy
        }
        onTerms={
          openTerms
        }
      />
    )
  }

  // ============================================================
  // HELP
  // ============================================================

  if (screen === 'help') {
    return (
      <HelpSupportScreen
        onBack={() =>
          setScreen('profile')
        }
      />
    )
  }

  // ============================================================
  // PHARMACIST FALLBACK
  // ============================================================

  if (role === 'pharmacist') {
    return (
      <PharmacistHomeScreen
        deliveries={deliveries}
        pharmacyName={
          pharmacyProfile.name
        }
        onScanQr={() =>
          setScreen('qr-scan')
        }
        onOpenDelivery={(id) => {
          setActiveDeliveryId(id)

          setDeliveryDetailOrigin(
            'pharmacist-home'
          )

          setScreen(
            'pharmacist-delivery-detail'
          )
        }}
        onNavigate={
          pharmacistNavigateTo
        }
      />
    )
  }

  // ============================================================
  // HOME
  // ============================================================

  return (
    <HomeScreen
      medicines={medicines}
      points={points}
      unreadCount={unreadCount}
      onScan={() =>
        setScreen('scan')
      }
      onNavigate={navigateTo}
      onQuickAccess={
        handleQuickAccess
      }
    />
  )
}
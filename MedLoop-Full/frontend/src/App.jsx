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
import PlaceholderScreen from './screens/PlaceholderScreen.jsx'
import { getExpiryStatus } from './utils/expiry.js'
import { ACHIEVEMENTS } from './data/achievements.js'
import { THEMES } from './data/themes.js'

// Her başarılı ilaç ekleme işleminde kazanılan gerçek MedLoop puanı.
const POINTS_PER_MEDICINE = 20

/**
 * Ekran akışı: splash -> onboarding -> role -> home -> scan
 * -> (yalnızca başarılı taramada) add-medicine -> home
 * home / medicines / scan / notifications / profile arası geçiş alt
 * gezinme çubuğu (navigateTo) ile.
 * "Teslim Et" ve "Başarılarım" (Hızlı Erişim'den) henüz kendi özellikleri
 * geliştirilmemiş placeholder ekranlardır. Profil > Ayarlar'daki tüm
 * satırlar (Tema dahil) artık gerçek ekranlara sahip.
 * Gece Modu ve Tema GERÇEKTİR: <html> öğesine .dark / .theme-* class'ı
 * eklenir, index.css içindeki token'lar bu sayede tüm ekranlarda otomatik
 * değişir. Profil fotoğrafı kamera/galeriden gerçekten seçilebilir.
 * Gerçek bir router (react-router vb.) backend/routing kararlarıyla birlikte
 * eklenebilir; şimdilik odak bu akışın kendisi.
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
    () => typeof window !== 'undefined' && localStorage.getItem('medloop-dark-mode') === 'true'
  )
  const [activeSettingsKey, setActiveSettingsKey] = useState(null)
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

  // Rozet kriterlerini gerçek durumla karşılaştırır; bir rozet bir kez
  // kazanıldığında sette kalıcı kalır (kriter artık sağlanmasa bile).
  useEffect(() => {
    const ctx = {
      medicines: medicines.map((m) => ({ ...m, expiryStatusKey: getExpiryStatus(m.expiryDate).key })),
      points,
      isDarkMode,
      readNotificationCount: readNotificationIds.size,
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
  }, [medicines, points, isDarkMode, readNotificationIds])

  const unreadCount = medicines.filter((m) => {
    const status = getExpiryStatus(m.expiryDate).key
    return (status === 'expired' || status === 'soon') && !readNotificationIds.has(m.id)
  }).length

  // Alt gezinme çubuğundaki sekmeler arası geçiş.
  const navigateTo = (key) => {
    if (key === 'home') setScreen('home')
    else if (key === 'medicines') setScreen('medicines')
    else if (key === 'scan') setScreen('scan')
    else if (key === 'notifications') setScreen('notifications')
    else if (key === 'profile') setScreen('profile')
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

  const handleMarkNotificationRead = (id) => {
    setReadNotificationIds((prev) => new Set(prev).add(id))
  }

  const handleOpenMedicine = (medicine) => {
    setActiveMedicineId(medicine.id)
    setScreen('medicine-detail')
  }

  const handleUpdateMedicine = (updated) => {
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }

  const handleDeleteMedicine = (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id))
    setActiveMedicineId(null)
    setScreen('medicines')
  }

  const handleScanSuccess = (payload) => {
    setPendingScan(payload)
    setScreen('add-medicine')
  }

  const handleSaveMedicine = (medicine) => {
    setMedicines((prev) => [medicine, ...prev])
    setPoints((prev) => prev + POINTS_PER_MEDICINE)
    setPendingScan(null)
    setScreen('home')
  }

  const handleCancelAdd = () => {
    setPendingScan(null)
    setScreen('scan')
  }

  const handleOpenSetting = (key) => {
    if (key === 'tema') return setScreen('theme')
    if (key === 'bildirimler') return setScreen('notification-settings')
    if (key === 'gizlilik') return setScreen('privacy')
    if (key === 'yardim') return setScreen('help')
    if (key === 'hakkinda') return setScreen('about')
    setActiveSettingsKey(key)
    setScreen('settings-placeholder')
  }

  const handleTogglePref = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Gerçekten siler: dolaptaki ilaçlar, puan, okunma geçmişi ve rozetler
  // sıfırlanır. Bildirim tercihleri ve tema gibi ayarlar korunur.
  const handleClearAllData = () => {
    setMedicines([])
    setPoints(0)
    setReadNotificationIds(new Set())
    setUnlockedAchievements(new Set())
  }

  // Gerçek çıkış: oturumu (rol) sıfırlar ve rol seçim ekranına döner.
  // İlaçlar/puanlar bir sonraki girişte hâlâ orada olacak şekilde
  // (gerçek bir backend'de session'dan bağımsız veri gibi) korunur.
  const handleLogout = () => {
    setRole(null)
    setScreen('role')
  }

  if (screen === 'splash') {
    return <SplashScreen onFinish={() => setScreen('onboarding')} />
  }

  if (screen === 'onboarding') {
    return <OnboardingScreen onComplete={() => setScreen('role')} />
  }

  if (screen === 'role') {
    return (
      <RoleSelectionScreen
        onSelectRole={(selected) => {
          setRole(selected)
          setScreen('home')
        }}
        onHaveAccount={() => {
          setRole('citizen')
          setScreen('home')
        }}
      />
    )
  }

  if (screen === 'scan') {
    return <ScanScreen onBack={() => setScreen('home')} onScanSuccess={handleScanSuccess} onNavigate={navigateTo} />
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
        medicines={medicines}
        readIds={readNotificationIds}
        onMarkRead={handleMarkNotificationRead}
        onNavigate={navigateTo}
        prefs={notificationPrefs}
      />
    )
  }

  if (screen === 'deliver') {
    return (
      <PlaceholderScreen
        title="Teslim Et"
        description="İlaçlarını anlaşmalı eczanelere teslim etme akışı yakında burada olacak."
        icon={<BagIcon />}
        onBack={() => setScreen('home')}
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
        points={points}
        medicinesCount={medicines.length}
        achievementsCount={unlockedAchievements.size}
        themeName={currentTheme.name}
        avatarImage={avatarImage}
        onAvatarChange={setAvatarImage}
        onAvatarRemove={() => setAvatarImage(null)}
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
        onBack={() => setScreen('profile')}
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
    return <PrivacyScreen onClearData={handleClearAllData} onBack={() => setScreen('profile')} />
  }

  if (screen === 'about') {
    return <AboutScreen onBack={() => setScreen('profile')} />
  }

  if (screen === 'help') {
    return <HelpSupportScreen onBack={() => setScreen('profile')} />
  }

  return (
    <HomeScreen
      medicines={medicines}
      points={points}
      unreadCount={unreadCount}
      onScan={() => setScreen('scan')}
      onNavigate={navigateTo}
      onQuickAccess={handleQuickAccess}
    />
  )
}

function BagIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

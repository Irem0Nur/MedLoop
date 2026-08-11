import { useState } from 'react'
import SplashScreen from './screens/SplashScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import RoleSelectionScreen from './screens/RoleSelectionScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ScanScreen from './screens/ScanScreen.jsx'
import AddMedicineScreen from './screens/AddMedicineScreen.jsx'
import MedicinesScreen from './screens/MedicinesScreen.jsx'
import MedicineDetailScreen from './screens/MedicineDetailScreen.jsx'
import NotificationsScreen from './screens/NotificationsScreen.jsx'
import PlaceholderScreen from './screens/PlaceholderScreen.jsx'
import { getExpiryStatus } from './utils/expiry.js'

// Her başarılı ilaç ekleme işleminde kazanılan gerçek MedLoop puanı.
const POINTS_PER_MEDICINE = 20

/**
 * Ekran akışı: splash -> onboarding -> role -> home -> scan
 * -> (yalnızca başarılı taramada) add-medicine -> home
 * home / medicines / scan / notifications arası geçiş alt gezinme çubuğu (navigateTo) ile.
 * "Teslim Et" ve "Başarılarım" (deliver / achievements) Hızlı Erişim'den
 * açılan placeholder ekranlardır — henüz kendi özellikleri geliştirilmedi.
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

  const unreadCount = medicines.filter((m) => {
    const status = getExpiryStatus(m.expiryDate).key
    return (status === 'expired' || status === 'soon') && !readNotificationIds.has(m.id)
  }).length

  // Alt gezinme çubuğundaki sekmeler arası geçiş. "profile" henüz
  // geliştirilmedi; şimdilik dokunulduğunda bir şey olmuyor.
  const navigateTo = (key) => {
    if (key === 'home') setScreen('home')
    else if (key === 'medicines') setScreen('medicines')
    else if (key === 'scan') setScreen('scan')
    else if (key === 'notifications') setScreen('notifications')
  }

  // Ana sayfadaki Hızlı Erişim kartları — bottom nav'daki sekmelerle
  // (medicines, notifications) aynı navigateTo'yu, henüz geliştirilmeyen
  // hedefler için ise placeholder ekranları kullanır.
  const handleQuickAccess = (key) => {
    if (key === 'medicines' || key === 'notifications') navigateTo(key)
    else if (key === 'deliver') setScreen('deliver')
    else if (key === 'achievements') setScreen('achievements')
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
      <PlaceholderScreen
        title="Başarılarım"
        description="Kazandığın rozetler ve MedLoop puan geçmişin yakında burada olacak."
        icon={<MedalIcon />}
        onBack={() => setScreen('home')}
      />
    )
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
function MedalIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" /><path d="m9 3 3 5 3-5M9 9l-2-1M15 9l2-1" />
    </svg>
  )
}

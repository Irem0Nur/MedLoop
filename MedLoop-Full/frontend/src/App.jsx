import { useState } from 'react'
import SplashScreen from './screens/SplashScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import RoleSelectionScreen from './screens/RoleSelectionScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ScanScreen from './screens/ScanScreen.jsx'
import AddMedicineScreen from './screens/AddMedicineScreen.jsx'
import MedicinesScreen from './screens/MedicinesScreen.jsx'
import MedicineDetailScreen from './screens/MedicineDetailScreen.jsx'

/**
 * Ekran akışı: splash -> onboarding -> role -> home -> scan
 * -> (yalnızca başarılı taramada) add-medicine -> home
 * home / medicines / scan arası geçiş alt gezinme çubuğu (navigateTo) ile.
 * Gerçek bir router (react-router vb.) backend/routing kararlarıyla birlikte
 * eklenebilir; şimdilik odak bu akışın kendisi.
 */
export default function App() {
  const [screen, setScreen] = useState('splash') // splash | onboarding | role | home | scan | add-medicine | medicines | medicine-detail
  const [pendingScan, setPendingScan] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [role, setRole] = useState(null)
  const [activeMedicineId, setActiveMedicineId] = useState(null)

  // Alt gezinme çubuğundaki sekmeler arası geçiş. "notifications" ve
  // "profile" henüz geliştirilmedi; şimdilik dokunulduğunda bir şey olmuyor.
  const navigateTo = (key) => {
    if (key === 'home') setScreen('home')
    else if (key === 'medicines') setScreen('medicines')
    else if (key === 'scan') setScreen('scan')
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

  return <HomeScreen medicines={medicines} onScan={() => setScreen('scan')} onNavigate={navigateTo} />
}
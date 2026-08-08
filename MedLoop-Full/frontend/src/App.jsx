import { useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import ScanScreen from './screens/ScanScreen.jsx'
import AddMedicineScreen from './screens/AddMedicineScreen.jsx'

/**
 * Basit ekran akışı: home -> scan -> (yalnızca başarılı taramada) add-medicine -> home
 * Gerçek bir router (react-router vb.) backend/routing kararlarıyla birlikte
 * eklenebilir; şimdilik odak scan + add-medicine akışının kendisi.
 */
export default function App() {
  const [screen, setScreen] = useState('home') // home | scan | add-medicine
  const [pendingScan, setPendingScan] = useState(null)
  const [medicines, setMedicines] = useState([])

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

  if (screen === 'scan') {
    return <ScanScreen onBack={() => setScreen('home')} onScanSuccess={handleScanSuccess} />
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

  return <HomeScreen medicines={medicines} onScan={() => setScreen('scan')} />
}

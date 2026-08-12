import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { getNearbyPharmacies } from '../mock/pharmacyService.js'
import { distanceKm, formatDistance } from '../utils/distance.js'

const FALLBACK_POSITION = { lat: 38.4237, lng: 27.1428 }
const RECENTER_ZOOM = 15

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2d7d59;border:3px solid white;box-shadow:0 0 0 2px rgba(45,125,89,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#1e6b4c;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(14,46,32,0.35)">
    <div style="transform:rotate(45deg);width:8px;height:8px;border-radius:50%;background:white"></div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

export default function NearbyPharmacies() {
  const { status: geoStatus, position } = useGeolocation({ fallback: FALLBACK_POSITION })
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const mapRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    if (!position) return
    setLoading(true)
    getNearbyPharmacies(position).then((list) => {
      setPharmacies(list)
      setLoading(false)
    })
  }, [position])

  const pharmaciesWithDistance = pharmacies
    .map((p) => ({ ...p, distance: position ? distanceKm(position, p) : null }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))

  const updateScrollButtons = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    const reset = () => {
      if (el) el.scrollLeft = 0
      updateScrollButtons()
    }
    reset()
    const raf = requestAnimationFrame(reset)
    const timer = setTimeout(reset, 250)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [pharmaciesWithDistance.length])

  const scrollByCards = (direction) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * 288, behavior: 'smooth' })
  }

  const openDirections = (p) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank', 'noopener')
  }

  // Haritayı kullanıcının bilinen (en güncel) konumuna geri kaydırır.
  // mapRef.current, react-leaflet v5'te MapContainer'a verilen ref
  // sayesinde doğrudan Leaflet Map örneğidir (setView metodu ordan gelir).
  const recenterToUser = () => {
    if (!mapRef.current || !position) return
    mapRef.current.setView([position.lat, position.lng], RECENTER_ZOOM, {
      animate: true,
    })
  }

  return (
    <section className="relative z-10 mt-8">
      <h2 className="px-5 text-xs font-semibold text-forest-700/60 uppercase tracking-wide mb-3">
        Yakındaki Anlaşmalı Eczaneler
      </h2>

      <div className="mx-5 rounded-2xl overflow-hidden glass-card relative" style={{ height: 180 }}>
        {position ? (
          <MapContainer
            ref={mapRef}
            center={[position.lat, position.lng]}
            zoom={14}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[position.lat, position.lng]} icon={userIcon} />
            {pharmaciesWithDistance.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={pharmacyIcon}>
                <Popup>{p.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-forest-700/50">
            Harita yükleniyor...
          </div>
        )}

        {/* Konumuma git butonu — haritanın sağ alt köşesinde, kartların
            üzerinde kalır (z-index Leaflet kontrol katmanından yüksek). */}
        {position && (
          <button
            type="button"
            onClick={recenterToUser}
            aria-label="Konumuma git"
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-forest-700 active:scale-95 transition-transform"
            style={{ zIndex: 1000 }}
          >
            <LocateIcon />
          </button>
        )}
      </div>

      {geoStatus === 'denied' && (
        <p className="px-5 mt-2 text-xs text-forest-700/50">
          Konum izni verilmedi, örnek bölge gösteriliyor.
        </p>
      )}

      {/* Harita ile kartlar arasında, kaydırmayı kontrol eden ok satırı */}
      {pharmaciesWithDistance.length > 1 && (
        <div className="flex items-center justify-end gap-2 px-5 mt-3">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            disabled={!canScrollLeft}
            aria-label="Önceki eczaneler"
            className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-forest-700 disabled:opacity-30 transition-opacity"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            disabled={!canScrollRight}
            aria-label="Sonraki eczaneler"
            className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-forest-700 disabled:opacity-30 transition-opacity"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="no-scrollbar flex gap-3 overflow-x-auto px-5 mt-2 pb-1 scroll-smooth"
      >
        {loading ? (
          <div className="glass-card rounded-2xl p-4 text-sm text-forest-700/50 shrink-0">
            Eczaneler yükleniyor...
          </div>
        ) : (
          pharmaciesWithDistance.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl p-4 shrink-0 w-64">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-forest-900">{p.name}</h3>
                <span
                  className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    p.isOpen ? 'bg-sage-100 text-sage-400' : 'bg-forest-900/10 text-forest-700/50'
                  }`}
                >
                  {p.isOpen ? 'Açık' : 'Kapalı'}
                </span>
              </div>
              <p className="text-xs text-forest-700/60 mt-1">{p.address}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-medium text-forest-700/70">
                  {p.distance !== null ? formatDistance(p.distance) : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => openDirections(p)}
                  className="px-3 py-1.5 rounded-full bg-forest-600 text-white text-xs font-semibold"
                >
                  Yol Tarifi
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function ChevronIcon({ direction }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function LocateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}
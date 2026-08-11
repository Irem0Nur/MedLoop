/**
 * ------------------------------------------------------------------------
 * ENTEGRASYON NOKTASI
 * ------------------------------------------------------------------------
 * Harita ve konum GERÇEK (tarayıcının Geolocation API'si + Leaflet/
 * OpenStreetMap). Ancak "anlaşmalı eczane" verisi henüz bir backend'e
 * bağlı değil — bu dosya, kullanıcının gerçek konumunun yakınına serpiştirilmiş
 * SAHTE eczane kayıtları üretir.
 *
 * Gerçek API geldiğinde `getNearbyPharmacies` fonksiyonunun gövdesini şöyle
 * bir çağrıyla değiştirmek yeterli:
 *
 *   export async function getNearbyPharmacies({ lat, lng }) {
 *     const res = await fetch(
 *       `${import.meta.env.VITE_API_BASE_URL}/pharmacies/nearby?lat=${lat}&lng=${lng}`
 *     )
 *     if (!res.ok) throw new Error('PHARMACIES_FETCH_FAILED')
 *     return res.json() // Pharmacy[]
 *   }
 *
 * Dönen her kaydın aşağıdaki Pharmacy şekliyle uyuşması yeterli.
 * ------------------------------------------------------------------------
 */

const MOCK_OFFSETS = [
  { name: 'Merkez Eczanesi', address: 'Atatürk Cad. No:12', isOpen: true, dLat: 0.004, dLng: 0.003 },
  { name: 'Sağlık Eczanesi', address: 'Cumhuriyet Mah.', isOpen: true, dLat: -0.003, dLng: 0.005 },
  { name: 'Yeşilova Eczanesi', address: 'Yeşilova Mah. 128. Sk.', isOpen: false, dLat: 0.006, dLng: -0.004 },
  { name: 'Güven Eczanesi', address: 'İnönü Cad. No:45', isOpen: true, dLat: -0.006, dLng: -0.002 },
]

/**
 * @param {{ lat: number, lng: number }} origin - kullanıcının gerçek konumu
 * @returns {Promise<Array<{ id: string, name: string, address: string, isOpen: boolean, lat: number, lng: number }>>}
 */
export function getNearbyPharmacies(origin) {
  const pharmacies = MOCK_OFFSETS.map((p, i) => ({
    id: `pharmacy-${i}`,
    name: p.name,
    address: p.address,
    isOpen: p.isOpen,
    lat: origin.lat + p.dLat,
    lng: origin.lng + p.dLng,
  }))

  return new Promise((resolve) => setTimeout(() => resolve(pharmacies), 400))
}
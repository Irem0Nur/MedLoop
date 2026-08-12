// src/mock/pharmacyService.js
// Artık "mock" değil — OpenStreetMap Overpass API üzerinden GERÇEK eczane
// verisi çeker. Dosya adını/klasörünü değiştirmedim ki NearbyPharmacies.jsx
// içindeki `import { getNearbyPharmacies } from '../mock/pharmacyService.js'`
// satırı aynen çalışsın. İstersen sonra `src/services/pharmacyService.js`'e
// taşıyıp import'u güncelleyebilirsin — işlevsel bir fark yaratmaz.

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const SEARCH_RADIUS_METERS = 3000
const MAX_RESULTS = 12

// Basit gün kısaltması eşlemesi (opening_hours OSM formatı için)
const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * OSM opening_hours string'ini KESIN olmayan şekilde yorumlar.
 * Karmaşık/istisnalı formatları (PH, off vb.) desteklemez — sadece en
 * yaygın "Mo-Fr 09:00-19:00" tarzı aralıkları dener. Parse edilemezse
 * null döner (bilinmiyor anlamında), UI bu durumda "Kapalı" göstermesin
 * diye biz null'ı true'ya çeviriyoruz (aşağıya bak).
 */
function parseOpeningHours(value) {
  if (!value) return null
  if (/24\/7/i.test(value)) return true

  const now = new Date()
  const todayCode = DAY_CODES[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  try {
    const rules = value.split(';').map((r) => r.trim())
    for (const rule of rules) {
      const match = rule.match(/^([A-Za-z,\-]+)\s+([\d:]+)-([\d:]+)$/)
      if (!match) continue
      const [, dayPart, startStr, endStr] = match

      const daysCovered = expandDayRange(dayPart)
      if (!daysCovered.includes(todayCode)) continue

      const [sh, sm] = startStr.split(':').map(Number)
      const [eh, em] = endStr.split(':').map(Number)
      const startMinutes = sh * 60 + sm
      const endMinutes = eh * 60 + em

      return nowMinutes >= startMinutes && nowMinutes <= endMinutes
    }
    return null
  } catch {
    return null
  }
}

function expandDayRange(dayPart) {
  const codes = []
  for (const segment of dayPart.split(',')) {
    if (segment.includes('-')) {
      const [start, end] = segment.split('-')
      const startIdx = DAY_CODES.indexOf(start)
      const endIdx = DAY_CODES.indexOf(end)
      if (startIdx === -1 || endIdx === -1) continue
      for (let i = startIdx; i <= endIdx; i++) codes.push(DAY_CODES[i])
    } else if (DAY_CODES.includes(segment)) {
      codes.push(segment)
    }
  }
  return codes
}

function buildAddress(tags) {
  const parts = [tags['addr:street'], tags['addr:housenumber'] && `No:${tags['addr:housenumber']}`]
    .filter(Boolean)
    .join(' ')
  return parts || tags['addr:full'] || tags['addr:district'] || 'Adres bilgisi yok'
}

/**
 * position: { lat, lng }
 * Dönen değer NearbyPharmacies.jsx'in beklediği alanlarla birebir aynı:
 * { id, name, address, lat, lng, isOpen }
 */
export async function getNearbyPharmacies(position) {
  if (!position) return []

  const { lat, lng } = position
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
      way["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
    );
    out center tags;
  `

  let response
  try {
    response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      body: query,
    })
  } catch (err) {
    console.error('Overpass API isteği başarısız (ağ hatası):', err)
    return []
  }

  if (!response.ok) {
    console.error('Overpass API hata döndürdü:', response.status)
    return []
  }

  const data = await response.json()

  return data.elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) return null

      const tags = el.tags ?? {}
      const parsedOpen = parseOpeningHours(tags.opening_hours)

      return {
        id: String(el.id),
        name: tags.name || 'İsimsiz Eczane',
        address: buildAddress(tags),
        lat: elLat,
        lng: elLng,
        // opening_hours yorumlanamıyorsa "Kapalı" damgası vurmak yanıltıcı
        // olur — bilinmiyorsa açık kabul ediyoruz (bkz. not aşağıda).
        isOpen: parsedOpen === null ? true : parsedOpen,
      }
    })
    .filter(Boolean)
    .slice(0, MAX_RESULTS)
}
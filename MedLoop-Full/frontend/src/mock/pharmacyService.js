// src/mock/pharmacyService.js
// Artık "mock" değil — OpenStreetMap Overpass API üzerinden GERÇEK eczane
// verisi çeker. Dosya adını/klasörünü değiştirmedim ki NearbyPharmacies.jsx
// içindeki `import { getNearbyPharmacies } from '../mock/pharmacyService.js'`
// satırı aynen çalışsın. İstersen sonra `src/services/pharmacyService.js`'e
// taşıyıp import'u güncelleyebilirsin — işlevsel bir fark yaratmaz.

// Birden fazla halka açık Overpass sunucusu — biri rate-limit'e (429)
// takılırsa veya cevap vermezse sırayla diğerleri denenir.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]
const SEARCH_RADIUS_METERS = 3000
const MAX_RESULTS = 12

// Aynı konum için kısa süre içinde tekrar tekrar istek atmayı (ve bu
// yüzden rate-limit yemeyi) önlemek için sonuçları tarayıcı oturumunda
// (sessionStorage) birkaç dakika önbelleğe alıyoruz.
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 dakika
const CACHE_PRECISION = 3 // ~110m hassasiyetle konum yuvarlama (önbellek anahtarı için)

function getCacheKey(lat, lng) {
  return `medloop-pharmacies:${lat.toFixed(CACHE_PRECISION)},${lng.toFixed(CACHE_PRECISION)}`
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { timestamp, data } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }))
  } catch {
    // sessionStorage dolu/kapalı olabilir — önbellek olmadan devam ederiz
  }
}

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
  const cacheKey = getCacheKey(lat, lng)
  const cached = readCache(cacheKey)
  if (cached) return cached

  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
      way["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
    );
    out center tags;
  `

  let data = null
  let lastError = null

  // Sunucuları sırayla dene — biri 429/hata verirse bir sonrakine geç.
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { method: 'POST', body: query })
      if (!response.ok) {
        lastError = `${endpoint} -> HTTP ${response.status}`
        continue
      }
      data = await response.json()
      break
    } catch (err) {
      lastError = `${endpoint} -> ${err.message}`
    }
  }

  if (!data) {
    console.error('Tüm Overpass sunucuları başarısız oldu:', lastError)
    return []
  }

  const result = data.elements
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

  writeCache(cacheKey, result)
  return result
}
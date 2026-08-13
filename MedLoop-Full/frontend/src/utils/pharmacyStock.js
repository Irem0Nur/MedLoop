import { getExpiryStatus } from './expiry.js'

// Bir ilaç isminden aggregate edilmiş toplam adet bu eşiği geçerse
// "kritik stok" (acil imha gerektirir) sayılır. Gerçek bir eşik değil,
// demo amaçlı sabit bir değer — gerçek sistemde eczane bazında ayarlanabilir.
export const CRITICAL_STOCK_THRESHOLD = 30

/**
 * Tamamlanmış ve henüz imhaya gönderilmemiş (disposedAt yok) teslimatların
 * ilaçlarını isme göre gruplar. Her grup, o ilaca ait tüm "parti"leri
 * (batchNo/SKT farklı olabilir) ve toplam adedi içerir.
 *
 * @param {Array} deliveries - App.jsx'teki gerçek teslimat listesi
 * @returns {Array<{ name, dosage, form, totalQuantity, batches: Array, worstExpiryStatus }>}
 */
export function getStockGroups(deliveries) {
  const groups = new Map()

  deliveries
    .filter((d) => d.status === 'confirmed' && !d.disposedAt)
    .forEach((d) => {
      d.items.forEach((item) => {
        const key = item.name.trim().toLowerCase()
        if (!groups.has(key)) {
          groups.set(key, {
            name: item.name,
            dosage: item.dosage,
            form: item.form,
            totalQuantity: 0,
            batches: [],
          })
        }
        const group = groups.get(key)
        group.totalQuantity += Number(item.quantity) || 0
        group.batches.push({
          deliveryId: d.id,
          itemId: item.id,
          citizenName: d.citizenName,
          batchNo: item.batchNo || '—',
          expiryDate: item.expiryDate || null,
          quantity: item.quantity,
          confirmedAt: d.confirmedAt,
        })
      })
    })

  return Array.from(groups.values())
    .map((group) => {
      const statuses = group.batches.map((b) => getExpiryStatus(b.expiryDate).key)
      const worstExpiryStatus = statuses.includes('expired')
        ? 'expired'
        : statuses.includes('soon')
          ? 'soon'
          : 'safe'
      return {
        ...group,
        isCritical: group.totalQuantity >= CRITICAL_STOCK_THRESHOLD,
        worstExpiryStatus,
      }
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
}

/** Bir ilaç ismi için basit, tutarlı sahte bir "barkod" üretir (görsel amaçlı). */
export function mockBarcode(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return `869${String(hash).padStart(10, '0').slice(0, 10)}`
}

/**
 * İmhaya gönderilmiş (disposedAt dolu) teslimatları isme göre gruplar —
 * "İmha Edilenler" geçmişi için. getStockGroups'un tam tersi mantığıyla çalışır.
 */
export function getDisposedGroups(deliveries) {
  const groups = new Map()

  deliveries
    .filter((d) => d.status === 'confirmed' && d.disposedAt)
    .forEach((d) => {
      d.items.forEach((item) => {
        const key = item.name.trim().toLowerCase()
        if (!groups.has(key)) {
          groups.set(key, { name: item.name, dosage: item.dosage, form: item.form, totalQuantity: 0, batches: [] })
        }
        const group = groups.get(key)
        group.totalQuantity += Number(item.quantity) || 0
        group.batches.push({
          deliveryId: d.id,
          citizenName: d.citizenName,
          batchNo: item.batchNo || '—',
          quantity: item.quantity,
          disposedAt: d.disposedAt,
        })
      })
    })

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.batches[0]?.disposedAt) - new Date(a.batches[0]?.disposedAt)
  )
}
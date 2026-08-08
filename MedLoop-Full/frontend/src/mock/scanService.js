/**
 * ------------------------------------------------------------------------
 * GERÇEK ENTEGRASYON (mock/scanService.js'in yerine geçer)
 * ------------------------------------------------------------------------
 * Backend artık ../backend/app.py üzerinden çalışan bir Flask API.
 * VITE_API_BASE_URL, frontend/.env dosyasında tanımlanır (örn. http://localhost:5000).
 * ------------------------------------------------------------------------
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Yakalanan kareyi backend'e gönderip bir MedicineDraft döndürür.
 * @param {string} imageDataUrl - captureFrame() çıktısı (data:image/jpeg;base64,...)
 * @returns {Promise<{name:string, dosage:string, form:string, quantity:number, batchNo:string, expiryDate:string}>}
 */
export async function recognizeMedicine(imageDataUrl) {
  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  })

  if (!res.ok) {
    throw new Error('SCAN_FAILED')
  }

  return res.json()
}

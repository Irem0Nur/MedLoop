/**
 * ------------------------------------------------------------------------
 * ENTEGRASYON NOKTASI
 * ------------------------------------------------------------------------
 * Kamera tarafı (görüntü yakalama) bu depoda; kutu/barkod tanıma (OCR)
 * backend'i ayrı repoda. Bu dosya, o servis gelene kadar akışın uçtan uca
 * çalışabilmesi için SAHTE (mock) bir yanıt üretir.
 *
 * Gerçek entegrasyon için tek yapılması gereken `recognizeMedicine`
 * fonksiyonunun gövdesini aşağıdaki gibi bir çağrıyla değiştirmek:
 *
 *   export async function recognizeMedicine(imageDataUrl) {
 *     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/scan`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ image: imageDataUrl }),
 *     })
 *     if (!res.ok) throw new Error('SCAN_FAILED')
 *     return res.json() // { name, dosage, expiryDate, batchNo, quantity }
 *   }
 *
 * Form (AddMedicineScreen) döndürülen alan adlarına bağlı olduğu için,
 * backend yanıtının aşağıdaki MedicineDraft şekliyle uyuşması yeterli.
 * ------------------------------------------------------------------------
 */

const SAMPLE_RESULTS = [
  { name: 'Amoksisilin', dosage: '500 mg', form: 'Tablet', quantity: 14, batchNo: 'AMX-2291', expiryDate: '2027-03-18' },
  { name: 'Parol', dosage: '500 mg', form: 'Tablet', quantity: 20, batchNo: 'PRL-1187', expiryDate: '2026-11-02' },
  { name: 'Nifuroksazid', dosage: '200 mg', form: 'Kapsül', quantity: 12, batchNo: 'NFX-0654', expiryDate: '2026-09-25' },
]

let callCount = 0

/**
 * Yakalanan kareyi "tanır" ve bir MedicineDraft döndürür.
 * @param {string} _imageDataUrl - captureFrame() çıktısı (şimdilik kullanılmıyor)
 * @returns {Promise<{name:string, dosage:string, form:string, quantity:number, batchNo:string, expiryDate:string}>}
 */
export function recognizeMedicine(_imageDataUrl) {
  const result = SAMPLE_RESULTS[callCount % SAMPLE_RESULTS.length]
  callCount += 1

  return new Promise((resolve) => {
    // Gerçek OCR/barkod isteğinin süresini simüle eder.
    setTimeout(() => resolve({ ...result }), 1400)
  })
}

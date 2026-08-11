/**
 * Son kullanma tarihine göre durum bilgisi döndürür.
 * Eşikler: 0 gün ve altı = süresi geçmiş, 30 gün ve altı = yaklaşıyor.
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return { key: 'unknown', label: 'Tarih girilmemiş', daysLeft: null, badgeClass: 'bg-forest-900/10 text-forest-700/60' }
  }

  const diffMs = new Date(expiryDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return { key: 'expired', label: 'Süresi geçti', daysLeft, badgeClass: 'bg-rose-100 text-rose-500' }
  }
  if (daysLeft <= 30) {
    return { key: 'soon', label: `${daysLeft} gün kaldı`, daysLeft, badgeClass: 'bg-amber-100 text-amber-400' }
  }
  return { key: 'safe', label: `${daysLeft} gün kaldı`, daysLeft, badgeClass: 'bg-sage-100 text-sage-400' }
}
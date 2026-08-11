/**
 * Her rozetin `check(ctx)` fonksiyonu, o an gerçek uygulama durumuna göre
 * kriterin sağlanıp sağlanmadığını döndürür. Bir rozet bir kez kazanıldığında
 * App.jsx'teki `unlockedAchievements` seti içinde kalıcı olarak saklanır —
 * yani örneğin "Temiz Dolap" kazanıldıktan sonra bir ilacın süresi geçse bile
 * rozet geri alınmaz (gerçek başarı sistemlerinde olduğu gibi).
 *
 * ctx şekli: { medicines, points, isDarkMode, readNotificationCount }
 */
export const ACHIEVEMENTS = [
  {
    id: 'ilk-adim',
    title: 'İlk Adım',
    unlockedDescription: 'İlk ilacını dolabına ekledin.',
    lockedDescription: 'Kazanmak için: ilk ilacını tara ve ekle.',
    icon: 'pill',
    check: (ctx) => ctx.medicines.length >= 1,
  },
  {
    id: 'duzenli-takipci',
    title: 'Düzenli Takipçi',
    unlockedDescription: 'Dolabına 5 ilaç ekledin.',
    lockedDescription: 'Kazanmak için: dolabına toplam 5 ilaç ekle.',
    icon: 'stack',
    check: (ctx) => ctx.medicines.length >= 5,
  },
  {
    id: 'temiz-dolap',
    title: 'Temiz Dolap',
    unlockedDescription: 'Dolabında süresi geçmiş ilaç yokken en az 3 ilaç biriktirdin.',
    lockedDescription: 'Kazanmak için: süresi geçmiş ilaç olmadan en az 3 ilaç biriktir.',
    icon: 'shield',
    check: (ctx) =>
      ctx.medicines.length >= 3 && ctx.medicines.every((m) => m.expiryStatusKey !== 'expired'),
  },
  {
    id: 'puan-avcisi',
    title: 'Puan Avcısı',
    unlockedDescription: '100 MedLoop puanına ulaştın.',
    lockedDescription: 'Kazanmak için: 100 MedLoop puanına ulaş.',
    icon: 'star',
    check: (ctx) => ctx.points >= 100,
  },
  {
    id: 'bildirim-bekcisi',
    title: 'Bildirim Bekçisi',
    unlockedDescription: 'Bir bildirimi okundu olarak işaretledin.',
    lockedDescription: 'Kazanmak için: Bildirimler\'den bir uyarıyı okundu işaretle.',
    icon: 'bell',
    check: (ctx) => ctx.readNotificationCount >= 1,
  },
  {
    id: 'gece-kusu',
    title: 'Gece Kuşu',
    unlockedDescription: 'Gece Modu\'nu açtın.',
    lockedDescription: 'Kazanmak için: Profil\'den Gece Modu\'nu aç.',
    icon: 'moon',
    check: (ctx) => ctx.isDarkMode,
  },
]
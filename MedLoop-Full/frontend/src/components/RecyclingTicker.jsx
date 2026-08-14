const MESSAGES = [
  'Kullanılmayan ilaçlar, kullanılmayan bir kaynak olmasın.',
  'İlacını çöpe atma, doğru yere ulaştır.',
  'Her ilaç doğru şekilde değerlendirildiğinde, doğa bir adım daha kazanır.',
  'İlaç israfını azalt, geleceği koru.',
  'Evinde unutulan ilaç, geleceğin kaybı olmasın.',
  'İlacın ömrü biter, sorumluluğumuz bitmez.',
  'Fazlasını biriktirme, doğru şekilde değerlendir.'
  'Bir ilaç daha çöpe gitmesin.',
  'İsrafı azalt, döngüyü devam ettir.',
  'Sağlığını korurken doğayı da koru.',
  'Her kutu bir kaynak, her doğru adım bir fark.',
  'İlaçlarını takip et, israfı önle.',
  'Son kullanma tarihini bekleme, farkında ol.',
  'İhtiyacın olmayan ilaç, doğru yerde değer kazanabilir.',
  'Daha az atık, daha bilinçli bir gelecek.',
  'İlaçlarını unutma, doğayı da unutturma.',
  'Bugünün ilaç israfı, yarının çevre yükü olmasın.',
  'Kullanmadığın ilaçları kaderine bırakma.',
  'İlaçtan fazlasını koruyoruz: geleceğimizi.',
  'MedLoop ile ilaçların döngüsü, iyiliğin döngüsü olsun.'
]

/**
 * Hızlı Erişim'in altında, sürekli soldan sağa akan tek satırlık farkındalık
 * şeridi. İçerik iki kez art arda render edilip CSS animasyonuyla %50
 * kaydırılır — bu sayede döngü hiç kesilmeden (dikişsiz) akar.
 */
export default function RecyclingTicker() {
  const line = MESSAGES.join('   •   ') + '   •   '

  return (
    <div className="relative z-10 mt-6 overflow-hidden bg-forest-600/10 py-2.5">
      <div className="flex w-max whitespace-nowrap animate-marquee">
        <span className="text-xs font-medium text-forest-700 pr-0">{line}</span>
        <span className="text-xs font-medium text-forest-700" aria-hidden="true">{line}</span>
      </div>
    </div>
  )
}
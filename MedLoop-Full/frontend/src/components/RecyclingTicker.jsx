const MESSAGES = [
  'Kullanılmayan ilaçlar, kullanılmayan bir kaynak olmasın.',
  'İlacını çöpe atma, doğru yere ulaştır.',
  'Her ilaç doğru şekilde değerlendirildiğinde, doğa bir adım daha kazanır.',
  'İlaç israfını azalt, geleceği koru.',
  'Evinde unutulan ilaç, geleceğin kaybı olmasın.',
  'İlacın ömrü biter, sorumluluğumuz bitmez.',
  'Fazlasını biriktirme, doğru şekilde değerlendir.',
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
  'MedLoop ile ilaçların döngüsü, iyiliğin döngüsü olsun.',
]

const ICONS = [RecycleIcon, LeafIcon, TreeIcon, DropletIcon]

/**
 * Hızlı Erişim'in altında, üstünde geri dönüşüm/doğa ikonu olan küçük
 * kartların sürekli soldan sağa aktığı şerit. İçerik iki kez art arda
 * render edilip CSS animasyonuyla %50 kaydırılır — döngü dikişsiz akar.
 */
export default function RecyclingTicker() {
  const cards = MESSAGES.map((text, i) => ({ text, Icon: ICONS[i % ICONS.length] }))

  return (
    <div className="relative z-10 mt-6 overflow-hidden">
      <div className="flex w-max animate-marquee" style={{ animationDuration: '32s' }}>
        <CardRow cards={cards} />
        <CardRow cards={cards} ariaHidden />
      </div>
    </div>
  )
}

function CardRow({ cards, ariaHidden }) {
  return (
    <div className="flex gap-3 pr-3" aria-hidden={ariaHidden || undefined}>
      {cards.map((c, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl w-[130px] shrink-0 px-3 py-3 flex flex-col items-center text-center gap-1.5"
        >
          <span className="w-7 h-7 rounded-full bg-forest-600/15 text-forest-600 flex items-center justify-center shrink-0">
            <c.Icon />
          </span>
          <p className="text-[11px] leading-snug text-forest-700/80 font-medium">{c.text}</p>
        </div>
      ))}
    </div>
  )
}

function RecycleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6" />
      <path d="M4 4v4.6h4.6" />
      <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4" />
      <path d="M20 20v-4.6h-4.6" />
    </svg>
  )
}
function LeafIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13V7a1 1 0 0 1 1-1h6a7 7 0 0 1 7 7 7 7 0 0 1-7 7Z" />
      <path d="M11 20v-9" />
    </svg>
  )
}
function TreeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v6" />
    </svg>
  )
}
function DropletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
    </svg>
  )
}
import { useState, useEffect, useRef } from 'react'

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

const cards = MESSAGES.map((text, i) => ({ text, Icon: ICONS[i % ICONS.length] }))

/**
 * Hızlı Erişim'in altında, tek tek yana kayan kart slaytı.
 * Her 4 saniyede bir sonraki karta geçer; altta nokta göstergesi bulunur.
 * Kullanıcı bir noktaya dokunarak doğrudan o karta atlayabilir.
 */
export default function RecyclingTicker() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const goTo = (index) => {
    setCurrent(index)
    // Kullanıcı tıklamasında zamanlayıcıyı sıfırla
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % cards.length)
    }, 4000)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % cards.length)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const { Icon, text } = cards[current]

  return (
    <div className="relative z-10 mt-6 px-5">
      {/* Kart */}
      <div
        key={current}
        className="glass-card rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{ animation: 'cardSlideIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
      >
        <span className="w-8 h-8 rounded-full bg-forest-600/15 text-forest-600 flex items-center justify-center shrink-0 mt-0.5">
          <Icon />
        </span>
        <p className="text-[13px] leading-relaxed text-forest-700/80 font-medium">{text}</p>
      </div>

      {/* Nokta göstergesi */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}. söze git`}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === current ? 'var(--color-forest-600)' : 'var(--color-forest-600)',
              opacity: i === current ? 1 : 0.25,
              transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function RecycleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6" />
      <path d="M4 4v4.6h4.6" />
      <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4" />
      <path d="M20 20v-4.6h-4.6" />
    </svg>
  )
}
function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13V7a1 1 0 0 1 1-1h6a7 7 0 0 1 7 7 7 7 0 0 1-7 7Z" />
      <path d="M11 20v-9" />
    </svg>
  )
}
function TreeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v6" />
    </svg>
  )
}
function DropletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
    </svg>
  )
}
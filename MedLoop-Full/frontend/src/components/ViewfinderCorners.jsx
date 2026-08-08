const CORNER_POSITIONS = [
  { top: 0, left: 0, rotate: 0 },
  { top: 0, right: 0, rotate: 90 },
  { bottom: 0, right: 0, rotate: 180 },
  { bottom: 0, left: 0, rotate: 270 },
]

/**
 * Tarama ekranındaki dört köşe braketi. `state` prop'una göre renk/animasyon
 * değişir: 'waiting' (nötr), 'scanning' (nabız atar), 'success' (yeşil).
 */
export default function ViewfinderCorners({ state = 'waiting' }) {
  const strokeColor =
    state === 'success' ? '#6fd99a' : state === 'scanning' ? '#bfe8cf' : 'rgba(255,255,255,0.55)'

  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
      {CORNER_POSITIONS.map((pos, i) => (
        <svg
          key={i}
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className={`absolute transition-colors duration-500 ${state === 'scanning' ? 'animate-pulse' : ''}`}
          style={{ ...pos, transform: `rotate(${pos.rotate}deg)` }}
        >
          <path
            d="M4 20V10a6 6 0 0 1 6-6h10"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      ))}

      {state === 'scanning' && (
        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-mint-100 to-transparent shadow-[0_0_12px_4px_rgba(191,232,207,0.7)] animate-scan-line" />
      )}
    </div>
  )
}

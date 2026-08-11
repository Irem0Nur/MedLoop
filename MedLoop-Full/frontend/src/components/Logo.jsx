export default function Logo({ size = 40 }) {
  return (
    <div
      className="rounded-full bg-white/70 flex items-center justify-center shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3c4 0 7 2.5 7 6.5S16.5 15 13 15c-2.2 0-4-1.3-4-3.2 0-1.5 1.1-2.6 2.6-2.6 1.2 0 2 .8 2 1.9"
          stroke="#1e6b4c"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 21c-4 0-7-2.5-7-6.5S7.5 9 11 9c2.2 0 4 1.3 4 3.2 0 1.5-1.1 2.6-2.6 2.6-1.2 0-2-.8-2-1.9"
          stroke="#cf9b3f"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
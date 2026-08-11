export default function FeatureIconCard({ children }) {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto">
      <div className="absolute inset-0 rounded-[2rem] bg-white/60 shadow-[0_20px_40px_-15px_rgba(14,46,32,0.35)]" />
      <div className="absolute bottom-4 w-24 h-4 rounded-full bg-forest-900/10 blur-md" />
      <div className="relative">{children}</div>
    </div>
  )
}
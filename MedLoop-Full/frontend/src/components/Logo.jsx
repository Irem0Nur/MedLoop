import logoSrc from '../assets/MedLoop Logo.png'

/**
 * Uygulamadaki tek logo kaynağı — Splash, Onboarding, Rol Seçimi, Hakkımızda
 * gibi logo gösteren her ekran bu bileşeni kullanır. Logoyu değiştirmek
 * gerekirse yalnızca src/assets/MedLoop Logo.png dosyasını değiştirmek yeterli.
 */
export default function Logo({ size = 40 }) {
  return (
    <img
      src={logoSrc}
      alt="MedLoop"
      className="rounded-2xl shadow-sm shadow-forest-900/15 object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  )
}
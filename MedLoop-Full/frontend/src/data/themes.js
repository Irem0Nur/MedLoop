/**
 * Her tema, index.css'teki aynı mint- ve forest- CSS değişkenlerini yeniden
 * tanımlar (gece modunun yaptığı gibi) — yani tasarımın kendisi (cam kartlar,
 * degrade butonlar, boşluklar) hiç değişmez, sadece renkler değişir.
 *
 * `className` boşsa (varsayılan yeşil) <html>'e hiçbir class eklenmez.
 * `swatch` iki renk döndürür — tema seçim kartındaki küçük önizleme için.
 */
export const THEMES = [
  {
    id: 'green',
    name: 'Yeşil Cam',
    className: '',
    swatch: ['#cbe9d5', '#1e6b4c'],
  },
  {
    id: 'amber',
    name: 'Bal Şerbeti',
    className: 'theme-amber',
    swatch: ['#ffe8b8', '#c98d1e'],
  },
  {
    id: 'sky',
    name: 'Gökyüzü Fısıltısı',
    className: 'theme-sky',
    swatch: ['#bfdcff', '#3576c9'],
  },
  {
    id: 'peach',
    name: 'Şeftali Çiçeği',
    className: 'theme-peach',
    swatch: ['#ffccd2', '#cc4770'],
  },
  {
    id: 'lilac',
    name: 'Leylak Rüyası',
    className: 'theme-lilac',
    swatch: ['#dcc9ff', '#7847c2'],
  },
]
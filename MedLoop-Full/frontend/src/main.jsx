import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Render backend uyku modundaysa uygulama acilir acilmaz uyandirmaya basla.
// Bu istek uygulamanin acilmasini bekletmez.
fetch('https://medloop.onrender.com/health', {
  method: 'GET',
  cache: 'no-store',
}).catch(() => {
  // Backend henuz uyanmadiysa uygulamanin calismasini etkileme.
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

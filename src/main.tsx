import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ControlApp from './ControlApp'
import { purgeLegacyLocalState } from './lib/legacyStorage'
import './styles/global.css'

purgeLegacyLocalState()

const container = document.getElementById('root')

if (container) {
  /* אכיפת RTL גם ברמת ה-DOM, ולא רק דרך גיליון הסגנון */
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.setAttribute('lang', 'he')
  container.setAttribute('dir', 'rtl')

  /* נתיב יחיד נוסף — לא מצדיק ספריית ראוטינג */
  const path = window.location.pathname
    .replace(import.meta.env.BASE_URL, '')
    .replace(/^\/+|\/+$/g, '')

  const page = path === 'control' ? <ControlApp /> : <App />

  createRoot(container).render(<StrictMode>{page}</StrictMode>)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { purgeLegacyLocalState } from './lib/legacyStorage'
import './styles/global.css'

purgeLegacyLocalState()

const container = document.getElementById('root')

if (container) {
  /* אכיפת RTL גם ברמת ה-DOM, ולא רק דרך גיליון הסגנון */
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.setAttribute('lang', 'he')
  container.setAttribute('dir', 'rtl')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Preserved MessHunt styles (source of truth - copied from existing project, not redesigned)
import './styles/style.css'
import './styles/details.css'

// Shared foundation modules (ported behavior-preserving API/auth/UI/location helpers)
import './services/api'
import './services/ui'
import './data/locations'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

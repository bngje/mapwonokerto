import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DashboardPeta from './pages/Dashboard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardPeta />
  </StrictMode>,
)

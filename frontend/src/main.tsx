import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import './debug_imports.ts'
import App from './App.tsx'

console.log('[MAIN] All imports loaded successfully');
console.log('[MAIN] About to call createRoot');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

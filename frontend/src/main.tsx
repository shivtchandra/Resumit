import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Purge any stale result data from previous sessions on every app load.
// This prevents resume/analysis data from one user appearing for another.
['resumit_analysis_result', 'resumit_matchfix_result', 'resumit_github_result'].forEach(
    (key) => sessionStorage.removeItem(key)
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

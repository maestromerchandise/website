import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import About from './About.tsx'

// Named about-main rather than about, because Windows treats about.tsx and
// About.tsx as the same file and the entry would overwrite the page.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <About />
  </StrictMode>,
)

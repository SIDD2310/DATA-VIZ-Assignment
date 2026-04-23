import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './AccessibilityContext.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AccessibilityProvider>
  </StrictMode>,
)

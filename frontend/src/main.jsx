import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'
import './config/axios' // Import axios config to setup interceptors

// In dev, if we persisted a token in sessionStorage as a fallback, use it for Authorization header
// Note: avoid setting a global Authorization header in the app entry; rely on explicit `withCredentials` cookie or
// setting headers per-request to prevent accidental token leaks. Developers can set sessionStorage token manually
// in dev tools if needed for testing.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

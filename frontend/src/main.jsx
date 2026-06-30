import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster as HotToaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <HotToaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
        <SonnerToaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

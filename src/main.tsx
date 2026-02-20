import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { FavoritesProvider } from './context/FavoritesContext.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <FavoritesProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </FavoritesProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)

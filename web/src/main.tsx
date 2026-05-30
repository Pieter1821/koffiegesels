import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from 'react-oidc-context'

import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import { ThemeProvider } from './theme/ThemeProvider'
import { I18nProvider } from './i18n'
import { oidcConfig, onSigninCallback } from './auth/authConfig'
import { AuthGate } from './auth/AuthGate'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider locale="af">
        <QueryClientProvider client={queryClient}>
          <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
            <AuthGate>
              <App />
            </AuthGate>
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)

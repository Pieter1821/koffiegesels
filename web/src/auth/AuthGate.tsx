import { useEffect, type ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { useQueryClient } from '@tanstack/react-query'
import { Coffee } from 'lucide-react'
import { useT } from '@/i18n'
import { setAccessToken, setUnauthorizedHandler } from './token'

/** Centered, on-brand shell used for the loading / sign-in / error states. */
function AuthScreen({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-e1">
          <Coffee className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {body && <p className="mt-2 text-sm text-muted">{body}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}

/**
 * Gates the app behind a Keycloak (OIDC) session. Renders children only once
 * authenticated, keeps the API client's access token in sync, and routes 401s
 * back to a fresh sign-in.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const t = useT()

  // Mirror the live access token into the API client whenever it changes
  // (initial sign-in and silent renew both update `auth.user`).
  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null)
  }, [auth.user])

  // On a 401, drop any cached data and start a fresh sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear()
      void auth.signinRedirect()
    })
    return () => setUnauthorizedHandler(null)
  }, [auth, queryClient])

  if (auth.isLoading) {
    return <AuthScreen title={t('auth.loading')} />
  }

  if (auth.error) {
    return (
      <AuthScreen
        title={t('auth.error.title')}
        body={t('auth.error.body')}
        action={
          <button
            type="button"
            onClick={() => void auth.signinRedirect()}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-e1 transition-colors hover:bg-accent-hover"
          >
            {t('auth.retry')}
          </button>
        }
      />
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <AuthScreen
        title={t('auth.welcome')}
        body={t('auth.signInBody')}
        action={
          <button
            type="button"
            onClick={() => void auth.signinRedirect()}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-e1 transition-colors hover:bg-accent-hover"
          >
            {t('auth.signIn')}
          </button>
        }
      />
    )
  }

  return <>{children}</>
}

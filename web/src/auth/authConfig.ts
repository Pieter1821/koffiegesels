import type { AuthProviderProps } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'

const authority = import.meta.env.VITE_OIDC_AUTHORITY
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID

if (!authority || !clientId) {
  throw new Error(
    'Missing VITE_OIDC_AUTHORITY or VITE_OIDC_CLIENT_ID. Copy web/.env.example to web/.env.local.',
  )
}

export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  scope: 'openid profile email koffiegesels_api.all',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
}

/** Strip OIDC query params after Keycloak redirects back to the SPA. */
export function onSigninCallback(): void {
  window.history.replaceState({}, document.title, window.location.pathname)
}

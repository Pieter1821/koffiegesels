/**
 * Bridges the OIDC session (held by react-oidc-context) and the framework-agnostic
 * API client. The auth gate writes the current access token here; `apiFetch` /
 * `streamMessage` read it when building requests. Keeps `api/client.ts` free of
 * React/OIDC imports.
 */

let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

/** Registered by the auth gate; invoked when the API rejects a request with 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export function notifyUnauthorized(): void {
  onUnauthorized?.()
}

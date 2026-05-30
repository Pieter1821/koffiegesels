const apiBase = import.meta.env.VITE_API_BASE ?? '/api'

/**
 * POST + ReadableStream for SSE-style chat streaming (wire when Chat endpoint exists).
 */
export async function apiStreamPost(
  path: string,
  accessToken: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`

  return fetch(url, {
    method: 'POST',
    signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
}

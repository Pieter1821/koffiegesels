import type {
  ConversationDetail,
  ConversationSummary,
  MessageWithConversation,
  SendMessageResult,
} from './types'
import { readEventStream } from './stream'
import { getAccessToken, notifyUnauthorized } from '@/auth/token'

const apiBase = import.meta.env.VITE_API_BASE ?? '/api'

/** Authorization header for the current OIDC session, or `{}` if signed out. */
function authHeader(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiError extends Error {
  readonly status: number
  readonly body?: string

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildUrl(path: string): string {
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
}

/** JSON request to the backend via Vite proxy (dev) or ingress (prod). Carries the OIDC Bearer token. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    const body = await response.text().catch(() => undefined)
    throw new ApiError(`API ${response.status}: ${response.statusText}`, response.status, body)
  }

  return response
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)
  return response.json() as Promise<T>
}

export function listConversations(): Promise<ConversationSummary[]> {
  return apiJson('/conversations')
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return apiJson(`/conversations/${id}`)
}

export function createConversation(title?: string): Promise<ConversationSummary> {
  return apiJson('/conversations', {
    method: 'POST',
    body: JSON.stringify(title ? { title } : {}),
  })
}

export function deleteConversation(id: string): Promise<void> {
  return apiFetch(`/conversations/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function sendMessage(conversationId: string, content: string): Promise<SendMessageResult> {
  return apiJson(`/conversations/${conversationId}/send`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export interface StreamMessageCallbacks {
  /** Real persisted user message (replaces the optimistic one). */
  onMeta?: (userMessage: MessageWithConversation) => void
  /** A streamed chunk of assistant text. */
  onToken?: (delta: string) => void
  /** Final persisted assistant message. */
  onDone?: (assistantMessage: MessageWithConversation) => void
}

/**
 * Streams an assistant reply via SSE. Resolves once the stream ends; rejects
 * with {@link ApiError} on a non-OK response or a server `error` frame.
 */
export async function streamMessage(
  conversationId: string,
  content: string,
  callbacks: StreamMessageCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(buildUrl(`/conversations/${conversationId}/stream`), {
    method: 'POST',
    signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    const body = await response.text().catch(() => undefined)
    throw new ApiError(`API ${response.status}: ${response.statusText}`, response.status, body)
  }

  let streamError: ApiError | null = null

  await readEventStream(response, (event, data) => {
    switch (event) {
      case 'meta':
        callbacks.onMeta?.((JSON.parse(data) as { userMessage: MessageWithConversation }).userMessage)
        break
      case 'token':
        callbacks.onToken?.((JSON.parse(data) as { delta: string }).delta)
        break
      case 'done':
        callbacks.onDone?.((JSON.parse(data) as { assistantMessage: MessageWithConversation }).assistantMessage)
        break
      case 'error': {
        const payload = JSON.parse(data) as { title?: string; detail?: string; status?: number }
        streamError = new ApiError(payload.detail ?? payload.title ?? 'Stream error', payload.status ?? 500)
        break
      }
    }
  })

  if (streamError) {
    throw streamError
  }
}

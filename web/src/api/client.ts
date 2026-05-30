import type {
  ConversationDetail,
  ConversationSummary,
  SendMessageResult,
} from './types'

const apiBase = import.meta.env.VITE_API_BASE ?? '/api'

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

/** JSON request to the backend via Vite proxy (dev) or ingress (prod). No auth during Phase 4. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
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

/** Authenticated variant for Phase 6 — reintroduce Bearer token here. */
export async function apiFetchAuthenticated(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  return apiFetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

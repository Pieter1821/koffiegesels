import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendMessage,
} from '@/api/client'

export const conversationKeys = {
  all: ['conversations'] as const,
  detail: (id: string) => ['conversations', id] as const,
}

export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: listConversations,
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: id ? conversationKeys.detail(id) : ['conversations', 'none'],
    queryFn: () => getConversation(id!),
    enabled: id !== null,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title?: string) => createConversation(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) })
    },
  })
}

export interface SendVars {
  conversationId: string
  content: string
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, content }: SendVars) => sendMessage(conversationId, content),
    // Await the refetch so callers can clear optimistic state only once the
    // real user + assistant messages are in the cache.
    onSuccess: async (_data, { conversationId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
      ])
    },
  })
}

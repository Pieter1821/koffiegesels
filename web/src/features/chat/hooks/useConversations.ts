import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendMessage,
} from '../../../api/client'

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
    },
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

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId!, content),
    onSuccess: (_data, _content, _context) => {
      if (!conversationId) return
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) })
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
    },
  })
}

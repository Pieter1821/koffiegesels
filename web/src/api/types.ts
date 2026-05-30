export type MessageRole = 'user' | 'assistant' | 'system'

export interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[]
}

export interface MessageWithConversation extends Message {
  conversationId: string
}

export interface SendMessageResult {
  userMessage: MessageWithConversation
  assistantMessage: MessageWithConversation
}

import { useEffect, useRef } from 'react'
import type { Message } from '../../../api/types'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return <div className="message-list message-list--loading">Laai boodskappe…</div>
  }

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <p>Nog geen boodskappe nie. Stuur die eerste een hieronder.</p>
      </div>
    )
  }

  return (
    <div className="message-list" role="log" aria-live="polite">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`message message--${message.role}`}
          aria-label={message.role === 'user' ? 'Jy' : 'Assistent'}
        >
          <header className="message__role">
            {message.role === 'user' ? 'Jy' : 'Koffiegesels'}
          </header>
          <p className="message__content">{message.content}</p>
        </article>
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}

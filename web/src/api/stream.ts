/**
 * Minimal Server-Sent Events reader over `fetch` + ReadableStream.
 *
 * We use POST (not the native EventSource, which is GET-only) so the chat
 * message travels in the request body. Frames are `event:`/`data:` blocks
 * separated by a blank line, per the SSE spec.
 */
export async function readEventStream(
  response: Response,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error('Response has no body to stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        dispatchFrame(frame, onEvent)
        boundary = buffer.indexOf('\n\n')
      }
    }

    // Flush any trailing frame not terminated by a blank line.
    if (buffer.trim().length > 0) {
      dispatchFrame(buffer, onEvent)
    }
  } finally {
    reader.releaseLock()
  }
}

function dispatchFrame(frame: string, onEvent: (event: string, data: string) => void): void {
  let event = 'message'
  let data = ''

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      // Multiple data lines concatenate with newlines (SSE spec).
      data = data ? `${data}\n${line.slice(5).trimStart()}` : line.slice(5).trimStart()
    }
  }

  if (event || data) {
    onEvent(event, data)
  }
}

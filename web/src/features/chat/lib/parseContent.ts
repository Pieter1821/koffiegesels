export type ContentSegment =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string; lang?: string }

const FENCE = /```([\w+-]*)\n?([\s\S]*?)```/g

/** Split assistant/user content into text and fenced-code segments. */
export function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  FENCE.lastIndex = 0
  while ((match = FENCE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) segments.push({ type: 'text', value: text })
    }
    segments.push({
      type: 'code',
      lang: match[1] || undefined,
      value: match[2].replace(/\n$/, ''),
    })
    lastIndex = FENCE.lastIndex
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) segments.push({ type: 'text', value: text })
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: content }]
}

export function hasCode(content: string): boolean {
  FENCE.lastIndex = 0
  return FENCE.test(content)
}

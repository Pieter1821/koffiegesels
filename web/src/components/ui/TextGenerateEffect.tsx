import { useEffect, useMemo } from 'react'
import { motion, useAnimate, useReducedMotion, stagger } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * "Warms into existence" — words fade/blur up with a gentle stagger.
 * Used for freshly streamed assistant answers (the signature reveal).
 */
export function TextGenerateEffect({
  text,
  className,
  onSettled,
}: {
  text: string
  className?: string
  onSettled?: () => void
}) {
  const [scope, animate] = useAnimate()
  const reduce = useReducedMotion()
  const words = useMemo(() => text.split(/(\s+)/), [text])

  useEffect(() => {
    if (reduce) {
      onSettled?.()
      return
    }
    const controls = animate(
      'span[data-word]',
      { opacity: 1, filter: 'blur(0px)', y: 0 },
      { duration: 0.32, delay: stagger(0.028), ease: [0.2, 0, 0, 1] },
    )
    controls.then(() => onSettled?.())
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduce])

  if (reduce) {
    return <span className={className}>{text}</span>
  }

  return (
    <span ref={scope} className={className}>
      {words.map((word, i) =>
        /\s+/.test(word) ? (
          <span key={i}>{word}</span>
        ) : (
          <motion.span
            key={i}
            data-word
            initial={{ opacity: 0, filter: 'blur(6px)', y: 4 }}
            className="inline-block"
          >
            {word}
          </motion.span>
        ),
      )}
    </span>
  )
}

/** Three warm shimmer dots — the "thinking" state. */
export function ShimmerDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="vroeg-thinking-dot h-2 w-2 rounded-full bg-accent"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  )
}

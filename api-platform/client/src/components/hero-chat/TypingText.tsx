import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { prepare, layout } from '@chenglou/pretext'

interface TypingTextProps {
  text: string
  onComplete: () => void
  className?: string
  containerWidth?: number
}

const BASE_DELAY = 28
const JITTER = 18

export default function TypingText({ text, onComplete, className = '', containerWidth = 480 }: TypingTextProps) {
  const [displayed, setDisplayed] = useState(0)
  const doneRef = useRef(false)
  const heightRef = useRef<number | null>(null)

  useEffect(() => {
    const prepared = prepare(text, '14px Inter')
    const { height } = layout(prepared, containerWidth, 22)
    heightRef.current = height
  }, [text, containerWidth])

  useEffect(() => {
    setDisplayed(0)
    doneRef.current = false
    let i = 0

    const tick = () => {
      i++
      setDisplayed(i)
      if (i >= text.length) {
        if (!doneRef.current) {
          doneRef.current = true
          setTimeout(onComplete, 600)
        }
        return
      }
      const delay = BASE_DELAY + Math.random() * JITTER
      setTimeout(tick, delay)
    }

    const startDelay = setTimeout(tick, 400)

    return () => {
      clearTimeout(startDelay)
    }
  }, [text, onComplete])

  return (
    <span
      className={className}
      style={heightRef.current ? { display: 'block', minHeight: `${heightRef.current}px` } : undefined}
    >
      {text.slice(0, displayed)}
      {displayed < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-[2px] h-[1em] bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'

export type ChatStep = 'user-typing' | 'thinking' | 'schema' | 'executing' | 'result'

const STEP_DURATIONS: Record<ChatStep, { min: number; max: number }> = {
  'user-typing': { min: 8500, max: 9500 },
  thinking: { min: 3200, max: 3800 },
  schema: { min: 5200, max: 5800 },
  executing: { min: 4000, max: 4500 },
  result: { min: 7000, max: 8000 },
}

export function useChatSequence() {
  const [step, setStep] = useState<ChatStep>('user-typing')
  const [cycleKey, setCycleKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advanceFromTyping = useCallback(() => {
    setStep('thinking')
  }, [])

  const loopReset = useCallback(() => {
    setCycleKey((k) => k + 1)
    setStep('user-typing')
  }, [])

  useEffect(() => {
    if (step === 'user-typing') return

    const duration = STEP_DURATIONS[step]
    const ms = duration.min + Math.random() * (duration.max - duration.min)

    timerRef.current = setTimeout(() => {
      const nextMap: Record<ChatStep, ChatStep> = {
        'user-typing': 'thinking',
        thinking: 'schema',
        schema: 'executing',
        executing: 'result',
        result: 'result',
      }
      const next = nextMap[step]

      if (step === 'result') {
        setTimeout(loopReset, ms)
      } else {
        setStep(next)
      }
    }, ms)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [step, loopReset])

  return { step, cycleKey, advanceFromTyping }
}

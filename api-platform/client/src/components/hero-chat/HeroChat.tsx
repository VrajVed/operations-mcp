import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import { useChatSequence } from './useChatSequence'
import TypingText from './TypingText'
import SchemaReveal from './SchemaReveal'
import ExecutionLog from './ExecutionLog'
import ResultCard from './ResultCard'

const bakeryPrompt =
  'I run a small bakery with 3 ovens and 8 workers. We produce bread, cakes, and pastries. Bread gives \u20B940 profit, cakes \u20B970, pastries \u20B950. We only have 120 labor hours and 90 oven hours daily. Cakes take more oven time than bread. What combination maximizes profit?'

const stepContent = {
  'user-typing': {
    align: 'left' as const,
    icon: User,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    bubbleClass: 'bg-surface-2 max-w-[85%]',
  },
  thinking: {
    align: 'left' as const,
    icon: Bot,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    bubbleClass: 'bg-surface-1 border border-hairline mr-8',
  },
  schema: {
    align: 'left' as const,
    icon: Bot,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    bubbleClass: 'bg-transparent mr-8',
  },
  executing: {
    align: 'left' as const,
    icon: Bot,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    bubbleClass: 'bg-transparent mr-8',
  },
  result: {
    align: 'left' as const,
    icon: Bot,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    bubbleClass: 'bg-transparent mr-8',
  },
}

export default function HeroChat() {
  const { step, cycleKey, advanceFromTyping } = useChatSequence()

  return (
    <div className="relative">
      {/* Glow effect behind chat */}
      <div className="absolute -inset-4 bg-accent/5 rounded-2xl blur-2xl pointer-events-none" />

      {/* Chat window */}
      <div className="relative rounded-lg border border-hairline bg-surface-1 overflow-hidden shadow-2xl shadow-accent/5">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-hairline bg-surface-2">
          <div className="w-2 h-2 rounded-full bg-error/80" />
          <div className="w-2 h-2 rounded-full bg-warning/80" />
          <div className="w-2 h-2 rounded-full bg-success/80" />
          <div className="flex items-center gap-1.5 ml-3">
            <Bot size={14} className="text-accent" />
            <span className="text-xs font-medium text-ink-muted font-sans">Operations MCP Agent</span>
          </div>
        </div>

        {/* Chat content */}
        <div className="p-4 space-y-4 h-[320px] md:h-[380px] overflow-y-auto overflow-x-hidden scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cycleKey}-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* User message */}
              <div className="flex gap-2.5 mb-4 justify-end">
                <div className={`rounded-lg w-full p-3 ${stepContent['user-typing'].bubbleClass}`}>
                  <p className="text-sm text-ink leading-relaxed">
                    {step === 'user-typing' ? (
                      <TypingText
                        key={cycleKey}
                        text={bakeryPrompt}
                        onComplete={advanceFromTyping}
                      />
                    ) : (
                      bakeryPrompt
                    )}
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-full ${stepContent['user-typing'].iconBg} flex items-center justify-center shrink-0 mt-1`}>
                  <User size={14} className={stepContent['user-typing'].iconColor} />
                </div>
              </div>

              {/* AI response — only renders after user typing completes */}
              {step !== 'user-typing' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-2.5"
                >
                  <div className={`w-7 h-7 rounded-full ${stepContent[step].iconBg} flex items-center justify-center shrink-0 mt-1`}>
                    <Bot size={14} className={stepContent[step].iconColor} />
                  </div>
                  <div className={`rounded-lg ${stepContent[step].bubbleClass} flex-1 min-w-0`}>
                    {step === 'thinking' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                          />
                        </div>
                        <span className="text-xs text-ink-muted font-mono">Analyzing constraints...</span>
                      </div>

                      {/* Extraction indicators */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="flex flex-wrap gap-1.5 mt-3"
                      >
                        {[
                          { label: '3 ovens', color: 'text-info' },
                          { label: '8 workers', color: 'text-info' },
                          { label: '\u20B940', color: 'text-success' },
                          { label: '\u20B970', color: 'text-success' },
                          { label: '\u20B950', color: 'text-success' },
                          { label: '120hr labor', color: 'text-warning' },
                          { label: '90hr oven', color: 'text-warning' },
                        ].map((tag) => (
                          <motion.span
                            key={tag.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border border-hairline bg-surface-2 ${tag.color}`}
                          >
                            {tag.label}
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {step === 'schema' && (
                    <SchemaReveal
                      onComplete={() => {}}
                    />
                  )}

                  {step === 'executing' && (
                    <ExecutionLog
                      onComplete={() => {}}
                    />
                  )}

                  {step === 'result' && (
                    <ResultCard />
                  )}
                </div>
              </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

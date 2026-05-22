import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export default function CodeBlock({ code, language = '', showLineNumbers = false, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`group relative rounded-md border border-hairline bg-surface-1 ${className}`}>
      {language && (
        <div className="absolute top-0 left-0 px-3 py-1.5 text-xs text-ink-tertiary font-mono">{language}</div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-2 transition-all duration-150"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
      <pre className={`p-4 pt-3 overflow-x-auto scrollbar-thin text-sm leading-relaxed ${showLineNumbers ? 'pl-12' : ''}`}>
        <code className="font-mono text-ink-muted">{code}</code>
      </pre>
    </div>
  )
}

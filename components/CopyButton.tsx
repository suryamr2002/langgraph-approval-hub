// components/CopyButton.tsx
'use client'
import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-400 hover:text-white rounded px-2 py-1 text-xs transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LangGraph Approval Hub',
  description: 'Human-in-the-loop approvals for LangGraph agents — real-time dashboard, audit log, email/Slack notifications. Deploy free on Vercel + Supabase.',
  keywords: ['langgraph', 'human-in-the-loop', 'ai agents', 'approval workflow', 'nextjs', 'supabase'],
  authors: [{ name: 'Surya Murugan', url: 'https://github.com/suryamr2002' }],
  openGraph: {
    title: '⚡ LangGraph Approval Hub',
    description: 'Human-in-the-loop approvals for LangGraph agents — deploy free in 5 minutes.',
    url: 'https://langgraph-approval-hub.vercel.app',
    siteName: 'LangGraph Approval Hub',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '⚡ LangGraph Approval Hub',
    description: 'Human-in-the-loop approvals for LangGraph agents — deploy free in 5 minutes.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && (
          <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center">
            🔒 Read-only demo — browse freely, no changes saved.{' '}
            <a
              href="https://github.com/suryamr2002/langgraph-approval-hub"
              className="underline font-semibold"
            >
              Deploy your own →
            </a>
          </div>
        )}
        {children}
      </body>
    </html>
  )
}

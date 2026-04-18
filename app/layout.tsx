// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LangGraph Approval Hub',
  description: 'Enterprise human-in-the-loop approval dashboard for LangGraph agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 text-center">
            🎭 Demo mode — data is simulated.{' '}
            <a
              href="https://github.com/suryamr2002/langgraph-approval-hub"
              className="underline font-semibold"
            >
              Deploy your own →
            </a>
          </div>
        )}
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}

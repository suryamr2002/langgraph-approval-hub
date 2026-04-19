// app/docs/layout.tsx
import Link from 'next/link'
import DocsNav from '@/components/DocsNav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-extrabold text-green-600 text-base">⚡ Approval Hub Docs</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#why" className="hover:text-slate-900 transition-colors">Why this exists</a>
            <a href="#deploy" className="hover:text-slate-900 transition-colors">Quick Start</a>
            <a href="#basic" className="hover:text-slate-900 transition-colors">Code Patterns</a>
            <a href="#enterprise" className="hover:text-slate-900 transition-colors">Enterprise</a>
            <a href="#sdk-params" className="hover:text-slate-900 transition-colors">Reference</a>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 flex">
        <aside className="w-56 shrink-0 py-8">
          <div className="sticky top-20">
            <DocsNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0 py-10 pl-12">{children}</main>
      </div>
    </div>
  )
}

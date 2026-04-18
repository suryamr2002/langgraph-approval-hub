// components/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Pending', href: '/', icon: '📋' },
  { label: 'Audit Log', href: '/audit', icon: '📊' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col py-6 px-3 min-h-screen">
      <div className="px-3 mb-8 text-lg font-black text-green-600 tracking-tight">
        ⚡ Approval Hub
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${path === item.href
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

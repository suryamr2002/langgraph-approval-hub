// app/(main)/audit/page.tsx
export const dynamic = 'force-dynamic'

import AuditTable from '@/components/AuditTable'

async function getAuditRecords() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/audit`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  } catch {
    return { records: [], total: 0 }
  }
}

export default async function AuditPage() {
  const { records, total } = await getAuditRecords()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total ?? 0} total resolved decisions</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </div>
      </div>
      <AuditTable records={records} />
    </div>
  )
}

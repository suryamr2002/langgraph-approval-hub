// app/audit/page.tsx
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
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <a
          href="/api/audit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-600 hover:underline font-medium"
        >
          ↗ Export JSON
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-4">{total ?? 0} total resolved decisions</p>
      <AuditTable records={records} />
    </div>
  )
}

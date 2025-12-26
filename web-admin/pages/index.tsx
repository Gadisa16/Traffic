import Link from 'next/link'
import Layout from '../components/Layout'

export default function Dashboard() {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded shadow">Total vehicles: —</div>
          <div className="p-4 bg-white rounded shadow">Expiring soon: —</div>
          <div className="p-4 bg-white rounded shadow">Inspections today: —</div>
        </div>
        <div className="mt-6">
          <Link href="/vehicles" className="text-blue-600">View vehicles</Link>
        </div>
      </div>
    </Layout>
  )
}

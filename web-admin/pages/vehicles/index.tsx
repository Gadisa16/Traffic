import Layout from '../../components/Layout'
import VehicleList from '../../components/VehicleList'
import { RequireAuth } from '../../lib/useAuth'

export default function VehiclesPage() {
  return (
    <Layout>
      <RequireAuth>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Vehicles</h1>
          <VehicleList />
        </div>
      </RequireAuth>
    </Layout>
  )
}

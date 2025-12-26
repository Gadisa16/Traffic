import { NextPage } from 'next'
import VehicleForm from '../../components/VehicleForm'
import { RequireAuth } from '../../lib/useAuth'

const CreatePage: NextPage = () => {
  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Create Vehicle</h1>
        <VehicleForm />
      </div>
    </RequireAuth>
  )
}

export default CreatePage

import { render, waitFor } from '@testing-library/react-native'

// mock expo image picker to avoid importing native expo modules during tests
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ cancelled: true }))
}))

jest.mock('../src/lib/api', () => ({
  verifyVehicle: jest.fn(),
  recordScan: jest.fn()
}))
jest.mock('../src/lib/offline', () => ({ addToQueue: jest.fn() }))
jest.mock('../src/lib/storage', () => ({ addRecentScan: jest.fn() }))

import * as Api from '../src/lib/api'
import VerifyScreen from '../src/screens/VerifyScreen'

describe('VerifyScreen UI', () => {
  beforeEach(() => {
    ;(Api.verifyVehicle as jest.Mock).mockReset()
    ;(Api.recordScan as jest.Mock).mockReset()
  })

  test('renders vehicle info after verify', async () => {
    const data = { side_number: 'S-123', plate_number: 'ABC123', status: 'Active', owner: { name: 'Jon' } }
    ;(Api.verifyVehicle as jest.Mock).mockResolvedValue(data)
    ;(Api.recordScan as jest.Mock).mockResolvedValue({ ok: true })

    const route: any = { params: { code: 'ABC' } }
    const navigation: any = { goBack: jest.fn() }
    const { getByText } = render(<VerifyScreen route={route} navigation={navigation} />)

    await waitFor(() => {
      expect(getByText('ABC123')).toBeTruthy()
      expect(getByText('Active')).toBeTruthy()
      expect(getByText('Owner: Jon')).toBeTruthy()
    })
  })
})

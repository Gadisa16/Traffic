jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {}
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => { store[k] = v; return v }),
      removeItem: jest.fn(async (k: string) => { delete store[k]; return })
    }
  }
})

jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {}
  return {
    setItemAsync: jest.fn(async (k, v) => { store[k] = v; return Promise.resolve() }),
    getItemAsync: jest.fn(async (k) => store[k] ?? null),
    deleteItemAsync: jest.fn(async (k) => { delete store[k]; return Promise.resolve() })
  }
})

jest.mock('../src/lib/api', () => ({
  recordScan: jest.fn()
}))

import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordScan } from '../src/lib/api';
import * as Offline from '../src/lib/offline';

describe('offline queue', () => {
  beforeEach(async () => {
    // clear underlying storage
    await AsyncStorage.removeItem('mobile_inspector_queue_v1')
    ;(recordScan as jest.Mock).mockReset()
  })

  test('add, get, remove queue item', async () => {
    const item = await Offline.addToQueue({ code: 'ABC', when: 123, payload: { a: 1 } })
    const q = await Offline.getQueue()
    expect(q.length).toBeGreaterThan(0)
    await Offline.removeFromQueue(item.id)
    const q2 = await Offline.getQueue()
    expect(q2.find(i => i.id === item.id)).toBeUndefined()
  })

  test('retryItem succeeds when api recovers', async () => {
    // mock recordScan to fail twice then succeed
    const mock = (recordScan as jest.Mock)
    mock.mockImplementationOnce(() => Promise.reject(new Error('fail1')))
    mock.mockImplementationOnce(() => Promise.reject(new Error('fail2')))
    mock.mockImplementationOnce(() => Promise.resolve({ ok: true }))

    const added = await Offline.addToQueue({ code: 'XYZ', when: 111, payload: { t: 1 } })
    const res = await Offline.retryItem(added.id, 5)
    expect(res.ok).toBe(true)
    // ensure item removed from queue
    const q = await Offline.getQueue()
    expect(q.find(i => i.id === added.id)).toBeUndefined()
  })
})

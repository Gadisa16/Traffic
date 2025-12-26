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

jest.mock('../src/lib/api', () => ({
  recordScan: jest.fn()
}))

jest.mock('../src/lib/storage', () => ({
  markScanSynced: jest.fn(),
  markScanFailed: jest.fn(),
  addRecentScan: jest.fn()
}))

import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordScan } from '../src/lib/api';
import * as Offline from '../src/lib/offline';
import * as Storage from '../src/lib/storage';

describe('syncQueue partial success', () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem('mobile_inspector_queue_v1')
    ;(recordScan as jest.Mock).mockReset()
    ;(Storage.markScanSynced as jest.Mock).mockReset()
    ;(Storage.markScanFailed as jest.Mock).mockReset()
  })

  test('one succeeds one fails', async () => {
    const mock = (recordScan as jest.Mock)
    mock.mockImplementation(async (code: string) => {
      if (code === 'S1') return Promise.resolve({ ok: true })
      return Promise.reject(new Error('server down'))
    })

    const a = await Offline.addToQueue({ code: 'S1', when: 1, payload: {} })
    const b = await Offline.addToQueue({ code: 'S2', when: 2, payload: {} })

    const res = await Offline.syncQueue()
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.results)).toBe(true)
    expect(res.results).toBeDefined()
    const r1 = res.results!.find((r: any) => r.id === a.id)
    const r2 = res.results!.find((r: any) => r.id === b.id)
    expect(r1).toBeDefined()
    expect(r2).toBeDefined()
    expect(r1!.ok).toBe(true)
    expect(r2!.ok).toBe(false)

    // markScanSynced called for a, markScanFailed called for b
    expect((Storage.markScanSynced as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1)
    expect((Storage.markScanFailed as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1)

    // queue should still contain b
    const q = await Offline.getQueue()
    expect(q.find(i => i.id === b.id)).toBeDefined()
  })

  test('failed item increments retry metadata', async () => {
    const mock = (recordScan as jest.Mock)
    mock.mockImplementation(async (code: string) => {
      if (code === 'OK') return Promise.resolve({ ok: true })
      return Promise.reject(new Error('temporary'))
    })

    const good = await Offline.addToQueue({ code: 'OK', when: 10, payload: {} })
    const bad = await Offline.addToQueue({ code: 'BAD', when: 11, payload: {} })

    const res = await Offline.syncQueue()
    expect(res.ok).toBe(true)

    const q = await Offline.getQueue()
    const failed = q.find(i => i.id === bad.id)
    expect(failed).toBeDefined()
    // retry metadata should be updated for the failed item
    expect(failed?.retryCount).toBeGreaterThanOrEqual(1)
    expect(failed?.lastAttempt).not.toBeNull()
  })

  test('concurrent syncQueue call returns already syncing', async () => {
    // make recordScan take a short moment so the first sync stays in-progress
    const mock = (recordScan as jest.Mock)
    let calls = 0
    mock.mockImplementation(async (code: string) => {
      calls += 1
      if (calls === 1) return await new Promise((res) => setTimeout(() => res({ ok: true }), 50))
      return Promise.resolve({ ok: true })
    })

    const a = await Offline.addToQueue({ code: 'X1', when: 21, payload: {} })
    const b = await Offline.addToQueue({ code: 'X2', when: 22, payload: {} })

    // start first sync but don't await it yet
    const first = Offline.syncQueue()
    // immediately call again
    const second = await Offline.syncQueue()
    expect(second.ok).toBe(false)
    expect((second as any).message).toMatch(/Already syncing/i)

    // wait for the first to finish
    await first
  })
})

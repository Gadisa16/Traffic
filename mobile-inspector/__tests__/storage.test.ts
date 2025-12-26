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

import * as Storage from '../src/lib/storage';

describe('storage auth helpers', () => {
  beforeEach(async () => {
    // ensure no auth
    await Storage.clearToken()
  })

  test('save and get auth roundtrip', async () => {
    const auth = { token: 't1', refreshToken: 'r1', expiresAt: Date.now() + 1000 }
    await Storage.saveAuth(auth)
    const got = await Storage.getAuth()
    expect(got).not.toBeNull()
    expect(got?.token).toBe('t1')
    expect(got?.refreshToken).toBe('r1')
  })

  test('saveToken and getToken', async () => {
    await Storage.saveToken('only-token')
    const t = await Storage.getToken()
    expect(t).toBe('only-token')
    await Storage.clearToken()
    const t2 = await Storage.getToken()
    expect(t2).toBeNull()
  })
})

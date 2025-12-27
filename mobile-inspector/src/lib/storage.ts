import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'mobile_inspector_token'
const RECENT_KEY = 'mobile_inspector_recent'

export type AuthRecord = { token: string; refreshToken?: string; expiresAt?: number }

export async function saveAuth(auth: AuthRecord) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(auth))
  } catch (e) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(auth))
    } catch (e2) {
      // ignore
    }
  }
}

export async function getAuth(): Promise<AuthRecord | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthRecord
  } catch (e) {
    try {
      const raw = await AsyncStorage.getItem(TOKEN_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AuthRecord
    } catch (e2) {
      return null
    }
  }
}

export async function saveToken(token: string) {
  return saveAuth({ token })
}

export async function getToken() {
  const a = await getAuth()
  return a?.token ?? null
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch (e) {
    // ignore
  }
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
  } catch (e2) {
    // ignore
  }
}

export type RecentScan = { code: string; result?: any; when: number; syncStatus?: 'pending' | 'synced' | 'failed' | 'unknown'; queueId?: string }

export async function addRecentScan(item: RecentScan) {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY)
    const arr = raw ? JSON.parse(raw) as RecentScan[] : []
    arr.unshift(item)
    // keep last 100
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 100)))
  } catch (e) {
    // ignore
  }
}

export async function getRecentScans(): Promise<RecentScan[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) as RecentScan[] : []
  } catch (e) {
    return []
  }
}

export async function markScanSynced(queueId: string) {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY)
    if (!raw) return
    const arr = JSON.parse(raw) as RecentScan[]
    const idx = arr.findIndex((r) => r.queueId === queueId)
    if (idx === -1) return
    arr[idx].syncStatus = 'synced'
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 100)))
  } catch (e) {
    // ignore
  }
}

export async function markScanFailed(queueId: string) {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY)
    if (!raw) return
    const arr = JSON.parse(raw) as RecentScan[]
    const idx = arr.findIndex((r) => r.queueId === queueId)
    if (idx === -1) return
    arr[idx].syncStatus = 'failed'
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 100)))
  } catch (e) {
    // ignore
  }
}

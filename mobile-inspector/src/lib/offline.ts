import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Api from './api'
import * as Storage from './storage'

const QUEUE_KEY = 'mobile_inspector_queue_v1'
let syncing = false

export type QueuedItem = {
  id: string
  code: string
  when: number
  payload?: any
  retryCount?: number
  lastAttempt?: number | null
}

async function readQueue(): Promise<QueuedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedItem[]) : []
  } catch (e) {
    return []
  }
}

async function writeQueue(items: QueuedItem[]) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch (e) {
    // ignore
  }
}

export async function addToQueue(item: Omit<QueuedItem, 'id'>) {
  const existing = await readQueue()
  const id = `${item.code}_${item.when}`
  const queued: QueuedItem = { id, ...item, retryCount: 0, lastAttempt: null }
  existing.push(queued)
  await writeQueue(existing)
  return queued
}

export async function getQueue() {
  return readQueue()
}

export async function removeFromQueue(id: string) {
  const items = await readQueue()
  const filtered = items.filter(i => i.id !== id)
  await writeQueue(filtered)
}

export async function syncQueue() {
  if (syncing) return { ok: false, message: 'Already syncing' }
  syncing = true
  try {
    const items = await readQueue()
    const results: { id: string; ok: boolean; error?: string }[] = []
    for (const it of items) {
      try {
        // try to post the inspection record
        await Api.recordScan(it.code, { when: it.when, payload: it.payload })
        results.push({ id: it.id, ok: true })
        await removeFromQueue(it.id)
        // mark recent scan as synced when upload succeeded
        try { await Storage.markScanSynced(it.id) } catch (e) { }
      } catch (err: any) {
        results.push({ id: it.id, ok: false, error: err?.message ? String(err.message) : String(err) })
        try { await Storage.markScanFailed(it.id) } catch (e) { }
        // update retry metadata for the item in persistent queue
        try {
          const updated = (await readQueue()).map((q) => {
            if (q.id !== it.id) return q
            const next = { ...q }
            next.retryCount = (next.retryCount || 0) + 1
            next.lastAttempt = Date.now()
            return next
          })
          await writeQueue(updated)
        } catch (e) { }
        // continue to next so partial syncs are possible
      }
    }
    return { ok: true, results }
  } finally {
    syncing = false
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function retryItem(id: string, maxAttempts = 5) {
  const items = await readQueue()
  const it = items.find((i) => i.id === id)
  if (!it) return { ok: false, message: 'Not found' }

  let attempt = 0
  let delay = 1000
  while (attempt < maxAttempts) {
    try {
      await Api.recordScan(it.code, { when: it.when, payload: it.payload })
      // on success remove and mark
      await removeFromQueue(it.id)
      try { await Storage.markScanSynced(it.id) } catch (e) {}
      return { ok: true }
    } catch (err: any) {
      attempt += 1
      if (attempt >= maxAttempts) {
        try { await Storage.markScanFailed(it.id) } catch (e) {}
        return { ok: false, message: String(err?.message ?? err) }
      }
      await sleep(delay)
      delay = Math.min(30000, delay * 2)
    }
  }
  return { ok: false, message: 'exhausted' }
}

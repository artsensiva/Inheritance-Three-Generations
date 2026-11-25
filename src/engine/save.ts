import type { GameState } from './types'
import { EVENTS } from '../content/events'
import { STARTS, AMBITIONS } from '../content/catalog'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'inheritance.save.v1'
export const DEMO_SAVE_KEY = 'inheritance.demo.save.v1'

export interface StorageLike {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

export interface SaveFile {
  version: number
  savedAt: number
  state: GameState
}

export type LoadResult =
  | { ok: true; state: GameState; savedAt: number }
  | { ok: false; reason: 'none' | 'invalid'; message: string }

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** Structural validation: rejects hand-edited or truncated saves. */
export function validateState(x: unknown): x is GameState {
  if (!x || typeof x !== 'object') return false
  const s = x as GameState
  if (s.v !== 1) return false
  if (!isNum(s.seed) || !isNum(s.rng) || !isNum(s.gen) || !isNum(s.turn)) return false
  if (!STARTS[s.startId] || !AMBITIONS[s.ambitionId]) return false
  if (s.gen < 1 || s.gen > 3 || s.turn < 0 || s.turn > 7) return false
  if (!['choose', 'result', 'ledger', 'heir', 'ended'].includes(s.phase)) return false
  for (const k of ['money', 'bonds', 'debt'] as const) if (!isNum(s[k]) || s[k] < 0 || s[k] > 12) return false
  if (!s.char || !isNum(s.char.health) || !isNum(s.char.knowledge) || typeof s.char.name !== 'string') return false
  if (!Array.isArray(s.props) || !Array.isArray(s.obl) || !Array.isArray(s.flags) || !Array.isArray(s.history) || !Array.isArray(s.past) || !Array.isArray(s.queue)) return false
  if (s.phase === 'choose' && (!s.current || !EVENTS[s.current.ev])) return false
  if (s.phase === 'result' && (s.lastEntry === null || !s.history[s.lastEntry])) return false
  if (s.phase === 'heir' && !Array.isArray(s.heirOptions)) return false
  return true
}

export function writeSave(storage: StorageLike, state: GameState, now = Date.now(), key = SAVE_KEY): boolean {
  try {
    const f: SaveFile = { version: SAVE_VERSION, savedAt: now, state }
    storage.setItem(key, JSON.stringify(f))
    return true
  } catch {
    return false
  }
}

export function readSave(storage: StorageLike, key = SAVE_KEY): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { ok: false, reason: 'none', message: 'Saving is unavailable in this browser.' }
  }
  if (!raw) return { ok: false, reason: 'none', message: 'No saved run.' }
  try {
    const f = JSON.parse(raw) as SaveFile
    if (!f || f.version !== SAVE_VERSION) throw new Error('version')
    if (!validateState(f.state)) throw new Error('shape')
    return { ok: true, state: f.state, savedAt: f.savedAt }
  } catch {
    try {
      storage.setItem(`${key}.invalid`, raw)
      storage.removeItem(key)
    } catch {
      /* ignore */
    }
    return { ok: false, reason: 'invalid', message: 'The saved run could not be read, so it was set aside. You can start a new run.' }
  }
}

export function clearSave(storage: StorageLike, key = SAVE_KEY) {
  try {
    storage.removeItem(key)
  } catch {
    /* ignore */
  }
}

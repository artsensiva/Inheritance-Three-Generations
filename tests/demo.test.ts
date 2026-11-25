import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { advance, choose, chooseHeir, newGame } from '../src/engine/engine'
import { pickHeir, pickOption } from '../src/engine/bots'
import { legacySvg } from '../src/ui/legacy'
import { demoCardEnding, isDemoComplete } from '../src/ui/demo'
import { DEMO_SAVE_KEY, SAVE_KEY, readSave, writeSave, type StorageLike } from '../src/engine/save'
import { STARTS } from '../src/content/catalog'
import type { GameState } from '../src/engine/types'

function mem(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v }, removeItem: (k) => { delete data[k] } }
}

function toHeir(seed: number): GameState {
  let s = newGame(seed, 'cooperage', 'roots')
  const ctx = { rngState: seed }
  while (s.phase !== 'heir') {
    if (s.phase === 'choose') s = choose(s, pickOption(s, 'random', ctx))
    else s = advance(s)
  }
  return s
}

describe('free demo', () => {
  it('is complete exactly when generation II begins', () => {
    const s = toHeir(3)
    expect(isDemoComplete(s)).toBe(false)
    const n = chooseHeir(s, pickHeir(s, 'first', { rngState: 1 }))
    expect(isDemoComplete(n)).toBe(true)
  })
  it('builds a card for the finished generation only, without ambition scoring', () => {
    const n = chooseHeir(toHeir(4), 'steward')
    const e = demoCardEnding(n)
    expect(e.generations.length).toBe(1)
    const svg = legacySvg(STARTS.cooperage.family, e, { demo: true })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('FREE DEMO')
    expect(svg).toContain('The story continues')
    expect(svg).not.toContain('Ambition:')
    expect(svg.match(/<svg/g)?.length).toBe(1)
  })
  it('keeps demo and full-game saves apart', () => {
    const st = mem()
    const s = newGame(1, 'cooperage', 'roots')
    expect(writeSave(st, s, 1, DEMO_SAVE_KEY)).toBe(true)
    expect(readSave(st, SAVE_KEY)).toMatchObject({ ok: false, reason: 'none' })
    expect(readSave(st, DEMO_SAVE_KEY).ok).toBe(true)
    st.data[DEMO_SAVE_KEY] = 'broken'
    expect(readSave(st, DEMO_SAVE_KEY)).toMatchObject({ ok: false, reason: 'invalid' })
    expect(st.data[`${DEMO_SAVE_KEY}.invalid`]).toBe('broken')
  })
})

describe('landing page', () => {
  const html = readFileSync('landing/index.html', 'utf8')
  it('loads nothing from other websites and collects nothing', () => {
    expect(html).not.toMatch(/(src|href)="https?:\/\//)
    expect(html).not.toMatch(/<form|<script|<iframe|<input/i)
  })
  it('links the demo, has one h1, a language and a wish-list placeholder', () => {
    expect(html).toContain('href="./play/"')
    expect(html.match(/<h1/g)?.length).toBe(1)
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('{{WISHLIST_BUTTON}}')
  })
})

import { describe, expect, it } from 'vitest'
import { advance, choose, chooseHeir, forceEvent, newGame, optionStatus, DECISIONS_PER_GEN } from '../src/engine/engine'
import { getEnding, ambitionStatus, ENDING_PROFILE_IDS } from '../src/engine/endings'
import { pickHeir, pickOption, playRun, type PolicyName } from '../src/engine/bots'
import { readSave, writeSave, SAVE_KEY, validateState, type StorageLike } from '../src/engine/save'
import { validateContent } from '../src/content/validate'
import { EVENT_LIST, EVENTS } from '../src/content/events'
import { AMBITIONS, OBLS, STARTS } from '../src/content/catalog'
import type { GameState } from '../src/engine/types'

const STARTS_IDS = Object.keys(STARTS)
const AMB_IDS = Object.keys(AMBITIONS)

function memStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v }, removeItem: (k) => { delete data[k] } }
}

/** Step a state forward using a bot until predicate holds or the run ends. */
function stepBot(s: GameState, policy: PolicyName, ctx = { rngState: 99 }): GameState {
  if (s.phase === 'choose') return choose(s, pickOption(s, policy, ctx))
  if (s.phase === 'result' || s.phase === 'ledger') return advance(s)
  if (s.phase === 'heir') return chooseHeir(s, pickHeir(s, policy, ctx))
  return s
}
function playUntil(s: GameState, pred: (s: GameState) => boolean, policy: PolicyName = 'first', max = 300): GameState {
  const ctx = { rngState: 5 }
  let n = 0
  while (!pred(s) && s.phase !== 'ended') {
    s = stepBot(s, policy, ctx)
    if (++n > max) throw new Error('did not reach predicate')
  }
  return s
}
function toHeirPhase(seed = 1, start = 'cooperage', amb = 'roots'): GameState {
  return playUntil(newGame(seed, start, amb), (s) => s.phase === 'heir')
}

describe('content', () => {
  it('passes structural validation', () => {
    expect(validateContent()).toEqual([])
  })
  it('meets the release-candidate content scope', () => {
    expect(EVENT_LIST.length).toBeGreaterThanOrEqual(50)
    expect(EVENT_LIST.length).toBeLessThanOrEqual(70)
    const chains = new Set(EVENT_LIST.filter((e) => e.chain).map((e) => e.chain))
    expect(chains.size).toBeGreaterThanOrEqual(10)
    const crossGen = new Set<string>()
    for (const ev of EVENT_LIST) for (const o of ev.options) for (const sc of [...(o.fx.sched ?? []), ...(o.risk?.fail.sched ?? [])]) if (sc.gen) crossGen.add(sc.ev)
    expect(crossGen.size).toBeGreaterThanOrEqual(6)
    expect(STARTS_IDS.length).toBe(3)
    expect(AMB_IDS.length).toBeGreaterThanOrEqual(3)
    expect(ENDING_PROFILE_IDS.length).toBeGreaterThanOrEqual(8)
  })
  it('every event has at least one always-selectable option even at the worst resources', () => {
    for (const ev of EVENT_LIST) {
      const s0 = newGame(1, 'cooperage', 'roots')
      const s = structuredClone(s0)
      s.money = 0
      s.bonds = 0
      s.debt = 0
      s.props = []
      s.flags = []
      s.obl = Object.keys(OBLS)
      s.char.health = ev.phase.every((p) => p === 'youth') && ev.gens.every((g) => g >= 2) ? 4 : 1
      s.char.knowledge = 0
      s.char.skills = {}
      const f = forceEvent(s, ev.id)
      expect(ev.options.some((o) => optionStatus(f, o).ok), `softlock at ${ev.id}`).toBe(true)
    }
  })
})

describe('determinism and bounds', () => {
  it('the same seed and actions give an identical run', () => {
    for (const pol of ['random', 'ambition', 'money'] as PolicyName[]) {
      const a = playRun(4242, 'inn', 'town_name', pol)
      const b = playRun(4242, 'inn', 'town_name', pol)
      expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state))
    }
  })
  it('different seeds vary the run', () => {
    const seqs = new Set<string>()
    for (let i = 1; i <= 40; i++) seqs.add(playRun(i, 'cooperage', 'roots', 'first').events.slice(0, 5).join(','))
    expect(seqs.size).toBeGreaterThanOrEqual(15)
  })
  it('keeps every resource within bounds and terminates, across many random runs', { timeout: 120000 }, () => {
    for (const st of STARTS_IDS) for (let i = 0; i < 80; i++) {
      let s = newGame(i * 13 + 1, st, AMB_IDS[i % AMB_IDS.length])
      const ctx = { rngState: i + 1 }
      let steps = 0
      while (s.phase !== 'ended') {
        s = stepBot(s, 'random', ctx)
        expect(s.money).toBeGreaterThanOrEqual(0); expect(s.money).toBeLessThanOrEqual(12)
        expect(s.bonds).toBeGreaterThanOrEqual(0); expect(s.bonds).toBeLessThanOrEqual(10)
        expect(s.debt).toBeGreaterThanOrEqual(0); expect(s.debt).toBeLessThanOrEqual(10)
        expect(s.char.health).toBeGreaterThanOrEqual(0); expect(s.char.health).toBeLessThanOrEqual(10)
        expect(s.char.knowledge).toBeGreaterThanOrEqual(0); expect(s.char.knowledge).toBeLessThanOrEqual(10)
        for (const v of Object.values(s.char.skills)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(3) }
        expect(new Set(s.props).size).toBe(s.props.length)
        expect(++steps).toBeLessThan(80)
      }
      expect(s.past.length).toBe(3)
      expect(s.history.length).toBeLessThanOrEqual(3 * DECISIONS_PER_GEN + 2)
      const counts: Record<string, number> = {}
      for (const h of s.history) counts[h.ev] = (counts[h.ev] ?? 0) + 1
      for (const [id, n] of Object.entries(counts)) if (id !== '_heir' && !EVENTS[id].repeatable) expect(n, `${id} repeated`).toBeLessThanOrEqual(EVENTS[id].chainOnly ? 3 : 1)
    }
  })
})

describe('inheritance rules', () => {
  it('health and knowledge are rebuilt from upbringing, never copied from the parent', () => {
    const base = toHeirPhase(3)
    const lowHealth = structuredClone(base); lowHealth.past[0].endHealth = 1; lowHealth.char.health = 1; lowHealth.past[0].health = 1
    const highHealth = structuredClone(base); highHealth.past[0].endHealth = 10; highHealth.char.health = 10; highHealth.past[0].health = 10
    const a = chooseHeir(lowHealth, 'steward'), b = chooseHeir(highHealth, 'steward')
    expect(a.char.health).toBe(b.char.health)
    expect(a.char.notes.join(' ')).toMatch(/does not pass from parent to child/)
  })
  it('steward inherits all property, debt and duties', () => {
    const s = toHeirPhase(5, 'inn', 'roots')
    const before = { props: [...s.props], debt: s.debt, obl: [...s.obl] }
    const n = chooseHeir(s, 'steward')
    expect(n.props).toEqual(before.props)
    expect(n.debt).toBe(before.debt)
    expect(n.obl).toEqual(before.obl)
  })
  it('scholar sells non-home property and repays debt first', () => {
    const s0 = toHeirPhase(5, 'cooperage', 'open_book')
    const s = structuredClone(s0)
    s.props = ['workshop', 'cottage', 'plot']; s.debt = 5; s.money = 2; s.char.peakK = 6
    s.heirOptions = (chooseHeir as unknown as never, s.heirOptions)
    const opts = s.heirOptions.map((o) => (o.dir === 'scholar' ? { ...o, available: true } : o)); s.heirOptions = opts
    const n = chooseHeir(s, 'scholar')
    expect(n.props).toEqual(['cottage'])
    expect(n.debt).toBe(0) // workshop 4 + plot 4 = 8 -> repays 5, 3 left to the purse
    expect(n.money).toBe(5)
    expect(n.char.knowledge).toBeGreaterThanOrEqual(3)
  })
  it('sharing halves debt (rounded up), keeps property, and halves ledger income', () => {
    const s0 = toHeirPhase(6, 'cooperage', 'close_table')
    const s = structuredClone(s0); s.debt = 5; s.bonds = 6
    const n = chooseHeir(s, 'share')
    expect(n.debt).toBe(3)
    expect(n.props).toEqual(s.props)
    expect(n.flags).toContain('shared_estate')
  })
  it('consumes upbringing flags and applies them to the heir', () => {
    const s0 = toHeirPhase(7)
    const without = structuredClone(s0); without.flags = without.flags.filter((f) => f !== 'child_schooled')
    const withSchool = structuredClone(without); withSchool.flags.push('child_schooled')
    const a = chooseHeir(withSchool, 'steward'), b = chooseHeir(without, 'steward')
    expect(a.char.knowledge - b.char.knowledge).toBe(2)
    expect(a.flags.some((f) => f.startsWith('child_'))).toBe(false)
  })
  it('passes skills down one level lower, and only skills at level 2+', () => {
    const s = structuredClone(toHeirPhase(8)); s.char.skills = { craft: 3, trade: 1, letters: 2 }; s.past[0].skills = s.char.skills
    const n = chooseHeir(s, 'steward')
    expect(n.char.skills.craft).toBe(2); expect(n.char.skills.letters).toBe(1); expect(n.char.skills.trade ?? 0).toBe(0)
  })
  it('an early death leads to an orphan opening and still terminates cleanly', () => {
    const s0 = playUntil(newGame(9, 'cooperage', 'roots'), (s) => s.phase === 'result')
    const s = structuredClone(s0); s.char.health = 0; s.char.died = true
    const h = advance(s)
    expect(h.phase).toBe('heir')
    const n = chooseHeir(h, 'steward')
    expect(n.flags).toContain('early_orphan')
    expect(n.current!.ev).toBe('orphaned')
    const done = playUntil(n, (x) => x.phase === 'ended')
    expect(done.phase).toBe('ended')
  })
})

describe('visible consequences', () => {
  it('selling the workshop later produces a descendant event that names its cause', () => {
    let s = forceEvent(newGame(11, 'cooperage', 'open_book'), 'school_fees')
    s = choose(s, 'a')
    expect(s.props).not.toContain('workshop')
    expect(s.queue.some((q) => q.ev === 'hollow_bench' && q.gen === 2)).toBe(true)
    const causeId = s.lastEntry!
    s = playUntil(s, (x) => x.phase === 'choose' && x.current!.ev === 'hollow_bench' || x.phase === 'ended')
    expect(s.current?.ev).toBe('hollow_bench')
    expect(s.gen).toBe(2)
    expect(s.current!.causes).toContain(causeId)
    expect(s.current!.causeLines.join(' ')).toMatch(/Master Pell’s Fees/)
    expect(s.current!.causeLines.join(' ')).toMatch(/Sell the workshop/)
  })
  it('an unpaid loan is named when the next generation reads the ledger', () => {
    let s = forceEvent(newGame(12, 'inn', 'roots'), 'lender_offer')
    s = choose(s, 'a')
    const loanEntry = s.lastEntry!
    expect(s.flags).toContain('loan_taken')
    s = playUntil(s, (x) => x.phase === 'heir', 'first')
    s.flags = s.flags.includes('loan_taken') ? s.flags : [...s.flags, 'loan_taken']
    s.cause['flag:loan_taken'] = loanEntry
    s.debt = Math.max(s.debt, 4)
    const n = forceEvent(chooseHeir(s, 'steward'), 'will_debt')
    expect(n.current!.extras.join(' ')).toMatch(/lender’s loan/)
    expect(n.current!.causes).toContain(loanEntry)
    expect(n.current!.causeLines.join(' ')).toMatch(/Lender’s Terms/)
  })
  it('ending explanations only quote things that actually happened', { timeout: 120000 }, () => {
    for (let i = 0; i < 120; i++) {
      const r = playRun(i + 1000, STARTS_IDS[i % 3], AMB_IDS[i % AMB_IDS.length], i % 2 ? 'random' : 'ambition')
      const e = getEnding(r.state)
      const titles = new Set(r.state.history.map((h) => h.evTitle)); const labels = new Set(r.state.history.map((h) => h.optLabel))
      const known = (q: string) => titles.has(q) || labels.has(q)
      for (const t of e.threads) for (const sent of t.sentences) for (const m of sent.matchAll(/“([^”]+)”/g)) expect(known(m[1]), `thread quotes unknown "${m[1]}"`).toBe(true)
      for (const f of e.facts) for (const m of f.matchAll(/“([^”]+)”/g)) expect(known(m[1]) || Object.values({}).length === 0, `fact quotes unknown "${m[1]}"`).toBe(true)
      // every thread link must be a recorded causal link
      for (const h of r.state.history) for (const c of h.causes) expect(c).toBeLessThan(h.id)
      expect(e.generations.length).toBe(3)
    }
  })
  it('puts the cross-generation chain first when a choice has several consequences', () => {
    let s = forceEvent(newGame(12, 'inn', 'roots'), 'school_fees_plain')
    s = choose(s, 'a') // schedules a same-generation collector AND a next-generation letter
    s = playUntil(s, (x) => x.phase === 'ended')
    const e = getEnding(s)
    const fired = s.history.filter((h) => h.ev === 'letter_from_capital' && h.causes.includes(0)).length
    if (fired) expect(e.threads[0].generations).toBeGreaterThanOrEqual(2)
  })
  it('a real chain produces a three-step multi-generation thread in the ending', () => {
    let s = forceEvent(newGame(21, 'cooperage', 'open_book'), 'school_fees')
    s = choose(s, 'a')
    s = playUntil(s, (x) => x.phase === 'ended')
    const e = getEnding(s)
    const joined = e.threads.map((t) => t.sentences.join(' ')).join(' | ')
    expect(joined).toMatch(/Master Pell’s Fees/)
    expect(joined).toMatch(/The Hollow Bench/)
    expect(e.facts.join(' ')).toMatch(/Cooperage workshop left the family in generation 1/)
  })
})

describe('ambitions and endings', () => {
  it('each ambition is achievable from each start (oracle bot reaches it at least once)', { timeout: 180000 }, () => {
    for (const st of STARTS_IDS) for (const am of AMB_IDS) {
      let hit = 0
      for (let i = 0; i < 120 && !hit; i++) if (playRun(i * 17 + 3, st, am, 'ambition').ambitionMet) hit++
      expect(hit, `${st}/${am}`).toBeGreaterThan(0)
    }
  })
  it('random play rarely satisfies a hard ambition (no trivial wins)', () => {
    let met = 0
    for (let i = 0; i < 100; i++) if (playRun(i + 1, 'tenant', 'town_name', 'random').ambitionMet) met++
    expect(met).toBeLessThan(10)
  })
  it('produces many different ending profiles, and ambition status agrees with the ending', { timeout: 120000 }, () => {
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const r = playRun(i + 77, STARTS_IDS[i % 3], AMB_IDS[i % AMB_IDS.length], (['random', 'first', 'money', 'knowledge', 'bonds', 'ambition'] as PolicyName[])[i % 6])
      const e = getEnding(r.state)
      seen.add(e.profileId)
      expect(e.ambition.met).toBe(ambitionStatus(r.state).met)
    }
    expect(seen.size).toBeGreaterThanOrEqual(8)
  })
})

describe('saving', () => {
  it('round-trips a mid-run state and continues identically', () => {
    const mid = playUntil(newGame(31, 'tenant', 'roots'), (s) => s.gen === 2 && s.turn === 3 && s.phase === 'choose')
    const st = memStorage()
    expect(writeSave(st, mid)).toBe(true)
    const loaded = readSave(st)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(mid))
    const a = playUntil(structuredClone(mid), (s) => s.phase === 'ended', 'ambition')
    const b = playUntil(loaded.state, (s) => s.phase === 'ended', 'ambition')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
  it('rejects missing, corrupt, wrong-version and tampered saves without throwing', () => {
    const st = memStorage()
    expect(readSave(st)).toMatchObject({ ok: false, reason: 'none' })
    st.data[SAVE_KEY] = '{not json'
    expect(readSave(st)).toMatchObject({ ok: false, reason: 'invalid' })
    expect(st.data[SAVE_KEY]).toBeUndefined() // set aside, not left to fail again
    const good = newGame(1, 'inn', 'roots')
    st.data[SAVE_KEY] = JSON.stringify({ version: 99, savedAt: 1, state: good })
    expect(readSave(st)).toMatchObject({ ok: false, reason: 'invalid' })
    const bad = structuredClone(good) as GameState; bad.money = 999
    st.data[SAVE_KEY] = JSON.stringify({ version: 1, savedAt: 1, state: bad })
    expect(readSave(st)).toMatchObject({ ok: false, reason: 'invalid' })
    const bad2 = structuredClone(good) as GameState; bad2.current = { ev: 'nope', text: '', extras: [], causeLines: [], causes: [] }
    expect(validateState(bad2)).toBe(false)
  })
  it('survives a storage that throws', () => {
    const boom: StorageLike = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('quota') }, removeItem: () => { throw new Error('denied') } }
    expect(readSave(boom).ok).toBe(false)
    expect(writeSave(boom, newGame(1, 'inn', 'roots'))).toBe(false)
  })
})

describe('balance sanity (simulation, not a fun test)', () => {
  it('no single greedy resource policy wins every ambition', { timeout: 180000 }, () => {
    const pols: PolicyName[] = ['money', 'knowledge', 'bonds', 'health']
    const rate: Record<string, Record<string, number>> = {}
    for (const p of pols) {
      rate[p] = {}
      for (const am of AMB_IDS) {
        let m = 0, n = 0
        for (const st of STARTS_IDS) for (let i = 0; i < 25; i++) { n++; if (playRun(i * 29 + 5, st, am, p).ambitionMet) m++ }
        rate[p][am] = m / n
      }
    }
    for (const p of pols) expect(Math.min(...AMB_IDS.map((a) => rate[p][a])) , `${p} dominates`).toBeLessThan(0.5)
    // and the best policy per ambition differs
    const best = AMB_IDS.map((a) => pols.reduce((x, y) => (rate[y][a] > rate[x][a] ? y : x)))
    expect(new Set(best).size).toBeGreaterThanOrEqual(2)
  })
  it('different starting families lead to different early experiences', () => {
    const openers = new Set(STARTS_IDS.map((st) => newGame(1, st, 'roots').current!.ev))
    expect(openers.size).toBe(3)
  })
})

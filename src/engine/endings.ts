import { AMBITIONS, MARK_LABELS, PROPS, SKILLS, STARTS } from '../content/catalog'
import { marksOf, MAX_GEN } from './engine'
import type { Char, Ending, GameState, GenSummary, HistoryEntry, Thread } from './types'

export interface AmbitionStatus {
  met: boolean
  conds: { label: string; ok: boolean }[]
}

function knowledgePeaks(s: GameState): number[] {
  const peaks = [...s.genKnowledgePeaks]
  if (peaks.length < s.gen) peaks.push(s.char.peakK)
  return peaks
}

export function ambitionStatus(s: GameState): AmbitionStatus {
  const marks = marksOf(s).length
  const peaks = knowledgePeaks(s)
  switch (s.ambitionId) {
    case 'roots': {
      const need = Math.max(2, s.startProps.length + 1)
      const conds = [
        { label: `Own at least ${need} properties — one more than the family began with, and never fewer than 2 (now ${s.props.length})`, ok: s.props.length >= need },
        { label: `Carry no debt (now ${s.debt})`, ok: s.debt === 0 },
      ]
      return { met: conds.every((c) => c.ok), conds }
    }
    case 'open_book': {
      const n = peaks.filter((p) => p >= 6).length
      const conds = [{ label: `Two generations reach knowledge 6+ (so far ${n})`, ok: n >= 2 }]
      return { met: conds.every((c) => c.ok), conds }
    }
    case 'close_table': {
      const conds = [
        { label: `Bonds 7 or higher (now ${s.bonds})`, ok: s.bonds >= 7 },
        { label: 'No feud or estrangement standing', ok: !s.flags.includes('feud') && !s.flags.includes('estranged') && !s.obl.includes('feud') },
        { label: `Debt no more than 2 (now ${s.debt})`, ok: s.debt <= 2 },
      ]
      return { met: conds.every((c) => c.ok), conds }
    }
    case 'town_name': {
      const conds = [{ label: `Leave 4 town marks (so far ${marks})`, ok: marks >= 4 }]
      return { met: conds.every((c) => c.ok), conds }
    }
    default:
      return { met: false, conds: [] }
  }
}

export function epithetFor(c: Char): string {
  const best = Object.entries(c.skills).sort((a, b) => b[1] - a[1])[0]
  if (c.died) return 'who left too soon'
  if (!best || best[1] < 1) return 'of the household'
  return `the ${SKILLS[best[0]]?.trade ?? 'worker'}`
}

function summarize(s: GameState): GenSummary[] {
  const chars = [...s.past]
  if (s.phase !== 'ended' && s.past.length < s.gen) chars.push(s.char)
  return chars.map((c) => ({
    gen: c.gen, name: c.name, epithet: epithetFor(c), died: c.died, endHealth: c.endHealth ?? c.health,
    endKnowledge: c.knowledge, peakKnowledge: c.peakK, skills: c.skills, dir: c.dir,
    keyChoices: s.history.filter((h) => h.gen === c.gen && h.key && h.ev !== '_heir').slice(0, 3).map((h) => h.optLabel),
    family: STARTS[s.startId].family,
  }))
}

// ---- causal threads: chains of recorded cause → effect links ----
function buildThreads(s: GameState): Thread[] {
  const H = s.history
  const children: Record<number, number[]> = {}
  for (const e of H) for (const c of e.causes) (children[c] ??= []).push(e.id)
  const roots = H.filter((e) => e.causes.length === 0 && (children[e.id] ?? []).length > 0)
  const paths: number[][] = []
  const dfs = (path: number[]) => {
    const last = path[path.length - 1]
    const next = (children[last] ?? []).filter((c) => !path.includes(c))
    if (!next.length) { if (path.length >= 2) paths.push(path); return }
    for (const c of next) dfs([...path, c])
  }
  for (const r of roots) dfs([r.id])
  const gensOf = (t: number[]) => new Set(t.map((i) => H[i].gen)).size
  paths.sort((a, b) => gensOf(b) - gensOf(a) || b.length - a.length || a[0] - b[0])
  const usedEdges = new Set<string>()
  const out: Thread[] = []
  for (const t of paths) {
    const edges = t.slice(1).map((id, i) => `${t[i]}>${id}`)
    if (edges.every((e) => usedEdges.has(e))) continue
    edges.forEach((e) => usedEdges.add(e))
    out.push({ generations: gensOf(t), sentences: threadSentences(t.map((i) => H[i])) })
    if (out.length >= 4) break
  }
  return out
}

function threadSentences(entries: HistoryEntry[]): string[] {
  const out: string[] = []
  entries.forEach((e, i) => {
    if (i === 0) out.push(`In generation ${e.gen}, at “${e.evTitle}”, the family chose “${e.optLabel}”.`)
    else {
      const prev = entries[i - 1]
      const when = e.gen === prev.gen ? 'Soon after' : `In generation ${e.gen}`
      out.push(`${when}, that choice came back: “${e.evTitle}” — and the family chose “${e.optLabel}”.`)
    }
  })
  return out
}

function facts(s: GameState): string[] {
  const out: string[] = []
  const H = s.history
  for (const p of s.startProps) {
    if (!s.props.includes(p)) {
      const id = s.cause[`prop:${p}`]
      const e = id !== undefined ? H[id] : undefined
      if (e) out.push(`The ${PROPS[p].name} left the family in generation ${e.gen}: “${e.optLabel}” (“${e.evTitle}”).`)
    }
  }
  for (const p of s.props) {
    if (!s.startProps.includes(p)) {
      const id = s.cause[`prop:${p}`]
      const e = id !== undefined ? H[id] : undefined
      if (e) out.push(`The ${PROPS[p].name} came to the family in generation ${e.gen}: “${e.optLabel}” (“${e.evTitle}”).`)
    }
  }
  if (s.debt > 0) {
    const id = s.cause['debt']
    const e = id !== undefined ? H[id] : undefined
    out.push(e ? `A debt of ${s.debt} remains. It was last added to in generation ${e.gen}, at “${e.evTitle}”.` : `A debt of ${s.debt} remains from before the family’s first decision.`)
  } else if (STARTS[s.startId].debt > 0) {
    out.push('The family began in debt and ended free of it.')
  }
  for (const m of marksOf(s)) {
    const e = H[s.cause[`flag:${m}`]]
    if (e) out.push(`The family left its mark on ${MARK_LABELS[m] ?? m} in generation ${e.gen}.`)
  }
  const peaks = knowledgePeaks(s)
  const hi = peaks.map((p, i) => ({ p, g: i + 1 })).filter((x) => x.p >= 6)
  if (hi.length) out.push(`Knowledge reached 6 or more in generation${hi.length > 1 ? 's' : ''} ${hi.map((x) => x.g).join(' and ')}.`)
  const died = s.past.filter((c) => c.died)
  for (const c of died) out.push(`${c.name} was lost before their generation was done (generation ${c.gen}).`)
  return out
}

const PROFILES: { id: string; title: string; blurb: string; test: (s: GameState, extra: { marks: number; peaks: number[] }) => boolean }[] = [
  { id: 'cut_short', title: 'The Candle Burned Short', blurb: 'The line ended sooner than anyone planned — but what was lit still shows on the wall.', test: (s) => s.char.died },
  { id: 'town_family', title: 'The Town’s Own', blurb: 'Wells, benches, bridges: the family is written into the stonework of Harrowmere.', test: (_, x) => x.marks >= 4 },
  { id: 'deep_roots', title: 'The House Still Stands', blurb: 'Two properties, no debt, and a door with the family name on it.', test: (s) => s.props.length >= 2 && s.debt === 0 },
  { id: 'readers', title: 'The Reading Family', blurb: 'Learning was the thing passed hand to hand, more reliably than any deed.', test: (_, x) => x.peaks.filter((p) => p >= 6).length >= 2 },
  { id: 'full_table', title: 'Everyone at the Table', blurb: 'Not rich, not famous — but they eat together, and they remember.', test: (s) => s.bonds >= 7 && s.debt <= 2 && !s.flags.includes('feud') && !s.flags.includes('estranged') && !s.obl.includes('feud') },
  { id: 'warm_heavy', title: 'A Warm House, Heavy Books', blurb: 'The family is close and the ledger is not. They carry the debt together, which is its own kind of inheritance.', test: (s) => s.bonds >= 7 && s.debt >= 3 },
  { id: 'long_ledger', title: 'The Long Ledger', blurb: 'Debt shaped three generations. The family held on, and the figure still stands.', test: (s) => s.debt >= 4 },
  { id: 'risen', title: 'From Tenants to Owners', blurb: 'They began with nothing under their feet and ended with a deed in the drawer.', test: (s) => STARTS[s.startId].props.length === 0 && s.props.length >= 1 },
  { id: 'empty_hands', title: 'Lighter Hands', blurb: 'The property is gone; the people are not. A family’s story can be written without deeds.', test: (s) => s.startProps.length > 0 && s.props.length === 0 },
  { id: 'gilded_quiet', title: 'A Full Strongbox, a Quiet House', blurb: 'Money is comfortable. The household is quiet in a way it was not once.', test: (s) => s.money >= 9 && s.bonds <= 4 },
  { id: 'scattered', title: 'The Scattered Table', blurb: 'The family spread out. Cards at midwinter, but no table.', test: (s) => s.bonds <= 3 },
  { id: 'steady', title: 'A Steady Line', blurb: 'No great fortune and no great fall: three generations that made do, and made something.', test: () => true },
]

export function getEnding(s: GameState): Ending {
  const marks = marksOf(s).length
  const peaks = knowledgePeaks(s)
  const prof = PROFILES.find((p) => p.test(s, { marks, peaks })) ?? PROFILES[PROFILES.length - 1]
  const a = ambitionStatus(s)
  return {
    profileId: prof.id, title: prof.title, blurb: prof.blurb,
    ambition: { id: s.ambitionId, title: AMBITIONS[s.ambitionId].title, met: a.met, conds: a.conds },
    generations: summarize(s), threads: buildThreads(s), facts: facts(s),
    stats: { money: s.money, bonds: s.bonds, debt: s.debt, props: [...s.props], marks, peakKnowledge: Math.max(...peaks) },
  }
}

export const ENDING_PROFILE_IDS = PROFILES.map((p) => p.id)
export { MAX_GEN }

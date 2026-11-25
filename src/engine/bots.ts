// Automated players for simulation and tests. They do NOT prove the game is fun;
// they exercise the rules (termination, reachability, dominance, imbalance).
import { advance, choose, chooseHeir, currentEvent, marksOf, optionStatus, newGame } from './engine'
import { ambitionStatus } from './endings'
import { nextRandom } from './rng'
import type { GameState, HeirDir, OptionDef } from './types'

export type PolicyName = 'random' | 'first' | 'money' | 'knowledge' | 'bonds' | 'health' | 'ambition' | 'greedyAny'

function score(s: GameState, policy: PolicyName): number {
  const m = marksOf(s).length
  switch (policy) {
    case 'money': return s.money * 3 - s.debt * 2 + s.props.length * 2
    case 'knowledge': return s.char.knowledge * 3 + s.char.peakK + (s.char.skills.letters ?? 0)
    case 'bonds': return s.bonds * 3 - (s.flags.includes('feud') ? 3 : 0) - (s.flags.includes('estranged') ? 3 : 0)
    case 'health': return s.char.health * 3 + s.money
    case 'greedyAny': return s.money + s.bonds + s.char.knowledge + s.char.health - s.debt
    case 'ambition': {
      switch (s.ambitionId) {
        case 'roots': return s.props.length * 5 - s.debt * 3 + s.money
        case 'open_book': return s.char.knowledge * 4 + s.char.peakK * 2 + (s.char.skills.letters ?? 0) * 2 + s.genKnowledgePeaks.filter((p) => p >= 7).length * 10
        case 'close_table': return s.bonds * 4 - (s.flags.includes('feud') ? 6 : 0) - (s.flags.includes('estranged') ? 6 : 0) - (s.obl.includes('feud') ? 6 : 0)
        case 'town_name': return m * 8 + s.money
        default: return 0
      }
    }
    default: return 0
  }
}

export interface BotCtx { rngState: number }

function rnd(ctx: BotCtx): number {
  const r = nextRandom(ctx.rngState)
  ctx.rngState = r.state
  return r.value
}

export function pickOption(s: GameState, policy: PolicyName, ctx: BotCtx): string {
  const ev = currentEvent(s)!
  const avail: OptionDef[] = ev.options.filter((o) => optionStatus(s, o).ok)
  if (avail.length === 0) throw new Error(`SOFTLOCK at ${ev.id}`)
  if (policy === 'random') return avail[Math.floor(rnd(ctx) * avail.length)].id
  if (policy === 'first') return avail[0].id
  let best = avail[0]
  let bestScore = -Infinity
  for (const o of avail) {
    const t = choose(s, o.id)
    const sc = score(t, policy) + rnd(ctx) * 0.01
    if (sc > bestScore) { bestScore = sc; best = o }
  }
  return best.id
}

export function pickHeir(s: GameState, policy: PolicyName, ctx: BotCtx): HeirDir {
  const avail = s.heirOptions.filter((o) => o.available).map((o) => o.dir)
  if (policy === 'random') return avail[Math.floor(rnd(ctx) * avail.length)]
  if (policy === 'first') return avail[0]
  if (policy === 'knowledge' || (policy === 'ambition' && s.ambitionId === 'open_book')) return avail.includes('scholar') ? 'scholar' : 'steward'
  if (policy === 'bonds' || (policy === 'ambition' && s.ambitionId === 'close_table')) return avail.includes('share') ? 'share' : 'steward'
  return 'steward'
}

export interface RunResult { state: GameState; steps: number; events: string[]; heirs: HeirDir[]; ambitionMet: boolean }

export function playRun(seed: number, startId: string, ambitionId: string, policy: PolicyName): RunResult {
  let s = newGame(seed, startId, ambitionId)
  const ctx: BotCtx = { rngState: (seed * 2654435761) >>> 0 }
  let steps = 0
  const events: string[] = []
  const heirs: HeirDir[] = []
  while (s.phase !== 'ended') {
    if (++steps > 200) throw new Error('run did not terminate')
    if (s.phase === 'choose') {
      events.push(s.current!.ev)
      s = choose(s, pickOption(s, policy, ctx))
    } else if (s.phase === 'result' || s.phase === 'ledger') s = advance(s)
    else if (s.phase === 'heir') {
      const d = pickHeir(s, policy, ctx)
      heirs.push(d)
      s = chooseHeir(s, d)
    }
  }
  return { state: s, steps, events, heirs, ambitionMet: ambitionStatus(s).met }
}

import { nextRandom } from './rng'
import { EVENTS, EVENT_LIST } from '../content/events'
import { HOMES, OBLS, PROPS, SKILLS, STARTS } from '../content/catalog'
import type {
  Char, CurrentEvent, EventDef, Fx, GameState, HeirDir, HeirOption, HistoryEntry, Ledger, LedgerLine,
  OptionDef, Phase, Req,
} from './types'

export const DECISIONS_PER_GEN = 7
export const MAX_GEN = 3
export const CAP = { money: 12, health: 10, knowledge: 10, bonds: 10, debt: 10 }
const LEDGER_AFTER = [3, DECISIONS_PER_GEN]

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function rand(d: GameState): number {
  const r = nextRandom(d.rng)
  d.rng = r.state
  return r.value
}

export function phaseOf(turn: number): Phase {
  if (turn === 0) return 'youth'
  if (turn <= 4) return 'prime'
  return 'late'
}

export function firstName(s: GameState) {
  return s.char.name
}

export function fill(s: GameState, text: string): string {
  return text.replaceAll('{name}', s.char.name).replaceAll('{family}', STARTS[s.startId].family)
}

// ---------- requirements ----------

export function meets(s: GameState, r?: Req): boolean {
  return failedReq(s, r) === null
}

/** Returns a human-readable description of the first unmet requirement, or null if all hold. */
export function failedReq(s: GameState, r?: Req): string | null {
  if (!r) return null
  if (r.m !== undefined && s.money < r.m) return `Needs ${r.m} coin on hand`
  if (r.mMax !== undefined && s.money > r.mMax) return `Only when money is ${r.mMax} or less`
  if (r.h !== undefined && s.char.health < r.h) return `Needs health ${r.h}`
  if (r.k !== undefined && s.char.knowledge < r.k) return `Needs knowledge ${r.k}`
  if (r.kMax !== undefined && s.char.knowledge > r.kMax) return `Only for knowledge ${r.kMax} or less`
  if (r.b !== undefined && s.bonds < r.b) return `Needs family bonds ${r.b}`
  if (r.bMax !== undefined && s.bonds > r.bMax) return `Only when bonds are ${r.bMax} or less`
  if (r.debt !== undefined && s.debt < r.debt) return `Needs debt of ${r.debt}`
  if (r.debtMax !== undefined && s.debt > r.debtMax) return `Needs debt of ${r.debtMax} or less`
  for (const f of r.flags ?? []) if (!s.flags.includes(f)) return `Needs: ${flagLabel(f)}`
  if (r.anyFlags && !r.anyFlags.some((f) => s.flags.includes(f))) return `Needs: ${r.anyFlags.map(flagLabel).join(' or ')}`
  for (const f of r.no ?? []) if (s.flags.includes(f)) return `Not possible after: ${flagLabel(f)}`
  for (const p of r.prop ?? []) if (!s.props.includes(p)) return `Needs the ${PROPS[p]?.name ?? p}`
  for (const p of r.noProp ?? []) if (s.props.includes(p)) return `Already own the ${PROPS[p]?.name ?? p}`
  if (r.anyProp && !r.anyProp.some((p) => s.props.includes(p))) return 'Needs property'
  for (const [sk, lv] of Object.entries(r.skill ?? {})) if ((s.char.skills[sk] ?? 0) < lv) return `Needs ${SKILLS[sk]?.name ?? sk} ${lv}`
  for (const o of r.obl ?? []) if (!s.obl.includes(o)) return `Needs: ${OBLS[o]?.name ?? o}`
  for (const o of r.noObl ?? []) if (s.obl.includes(o)) return `Blocked by: ${OBLS[o]?.name ?? o}`
  if (r.gen && !r.gen.includes(s.gen)) return 'Not in this generation'
  if (r.start && !r.start.includes(s.startId)) return 'Not for this family'
  return null
}

export const FLAG_LABELS: Record<string, string> = {
  guild_member: 'guild membership', sold_workshop: 'having sold the workshop', child_schooled: 'a schooled child',
  letters_taught: 'learned letters', family_cough: 'the family cough', mark_levee: 'the levee', mark_well: 'the well',
  mark_school: 'the school bench', mark_bridge: 'the footbridge', mark_lantern: 'the lantern night',
  estranged: 'an estrangement', feud: 'a feud',
}
export function flagLabel(f: string) {
  return FLAG_LABELS[f] ?? f.replaceAll('_', ' ')
}

// ---------- creating a game ----------

function zeroDelta() {
  return { m: 0, h: 0, k: 0, b: 0, debt: 0 }
}

export function newGame(seed: number, startId: string, ambitionId: string): GameState {
  const st = STARTS[startId]
  if (!st) throw new Error(`Unknown start ${startId}`)
  const s: GameState = {
    v: 1, seed: seed >>> 0, rng: seed >>> 0, startId, ambitionId,
    gen: 1, turn: 0, phase: 'choose',
    money: st.money, bonds: st.bonds, debt: st.debt, props: [...st.props], obl: [...st.obl], flags: [...st.flags],
    char: {
      name: st.firstNames[(seed >>> 0) % st.firstNames.length], gen: 1, health: st.health, knowledge: st.knowledge,
      skills: { ...st.skills }, peakK: st.knowledge, notes: [], died: false,
    },
    past: [], queue: [], used: [], themes: [], history: [], cause: {}, current: null, lastEntry: null, ledger: null,
    heirOptions: [], genKnowledgePeaks: [], startProps: [...st.props],
  }
  // pick a first name by seed but keep the order list for later generations
  const idx = (seed >>> 0) % st.firstNames.length
  s.char.name = st.firstNames[idx]
  return nextEvent(s)
}

function nameFor(s: GameState, gen: number): string {
  const names = STARTS[s.startId].firstNames
  const first = (s.seed >>> 0) % names.length
  return names[(first + gen - 1) % names.length]
}

// ---------- event selection ----------

function pickEvent(d: GameState): { ev: EventDef; cause?: number } {
  const st = STARTS[d.startId]
  if (d.gen === 1 && d.turn === 0) return { ev: EVENTS[st.opener] }
  if (d.turn === 0 && d.flags.includes('early_orphan') && !d.used.includes('orphaned')) return { ev: EVENTS['orphaned'] }
  const qi = d.queue.findIndex((q) => q.gen === d.gen && q.minTurn <= d.turn && EVENTS[q.ev])
  if (qi >= 0) {
    const q = d.queue.splice(qi, 1)[0]
    return { ev: EVENTS[q.ev], cause: q.cause }
  }
  const ph = phaseOf(d.turn)
  const recent = d.themes.slice(-2)
  const cands: { ev: EventDef; w: number }[] = []
  for (const ev of EVENT_LIST) {
    if (ev.chainOnly) continue
    if (!ev.gens.includes(d.gen) || !ev.phase.includes(ph)) continue
    if (!ev.repeatable && d.used.includes(ev.id)) continue
    if (!meets(d, ev.when)) continue
    let w = ev.weight
    if (recent.includes(ev.theme)) w *= 0.35
    if (w > 0) cands.push({ ev, w })
  }
  if (cands.length === 0) return { ev: EVENTS['quiet_year'] }
  const total = cands.reduce((a, c) => a + c.w, 0)
  let r = rand(d) * total
  for (const c of cands) {
    r -= c.w
    if (r <= 0) return { ev: c.ev }
  }
  return { ev: cands[cands.length - 1].ev }
}

export function describeEntry(e: HistoryEntry): string {
  return `In generation ${e.gen}, “${e.evTitle}”: the family chose “${e.optLabel}”.`
}

function compose(d: GameState, ev: EventDef, schedCause?: number): CurrentEvent {
  const causes: number[] = []
  if (schedCause !== undefined && d.history[schedCause]) causes.push(schedCause)
  if (ev.cause && d.cause[ev.cause] !== undefined) causes.push(d.cause[ev.cause])
  const extras: string[] = []
  for (const cb of ev.callbacks ?? []) {
    if (extras.length >= 2) break
    if (meets(d, cb.if)) {
      extras.push(fill(d, cb.text))
      if (cb.cause && d.cause[cb.cause] !== undefined) causes.push(d.cause[cb.cause])
    }
  }
  const uniq = [...new Set(causes)]
  return {
    ev: ev.id,
    text: fill(d, ev.text),
    extras,
    causeLines: uniq.slice(0, 2).map((id) => describeEntry(d.history[id])),
    causes: uniq,
  }
}

function nextEvent(d: GameState): GameState {
  const { ev, cause } = pickEvent(d)
  d.current = compose(d, ev, cause)
  d.phase = 'choose'
  d.ledger = null
  return d
}

// ---------- options ----------

export function optionStatus(s: GameState, o: OptionDef): { ok: boolean; reason?: string } {
  const r = failedReq(s, o.req)
  if (r) return { ok: false, reason: r }
  const m = o.fx.m ?? 0
  if (s.money + m < 0) return { ok: false, reason: `Costs ${-m} coin — you have ${s.money}` }
  if (s.char.health + (o.fx.h ?? 0) < 1) return { ok: false, reason: 'Too dangerous at your current health' }
  for (const p of o.fx.lose ?? []) if (!s.props.includes(p)) return { ok: false, reason: `Needs the ${PROPS[p]?.name ?? p}` }
  for (const sc of o.fx.free ?? []) if (!s.obl.includes(sc)) return { ok: false, reason: `No ${OBLS[sc]?.name ?? sc} to settle` }
  return { ok: true }
}

/** Short numeric chips describing an effect, for choice cards. */
export function fxChips(fx: Fx): string[] {
  const out: string[] = []
  const sgn = (n: number) => (n > 0 ? `+${n}` : `${n}`)
  if (fx.m) out.push(`${sgn(fx.m)} coin`)
  if (fx.h) out.push(`${sgn(fx.h)} health`)
  if (fx.k) out.push(`${sgn(fx.k)} knowledge`)
  if (fx.b) out.push(`${sgn(fx.b)} bonds`)
  if (fx.debt) out.push(fx.debt > 0 ? `take on ${fx.debt} debt` : `repay ${-fx.debt} debt`)
  for (const p of fx.gain ?? []) out.push(`gain ${PROPS[p]?.name ?? p}`)
  for (const p of fx.lose ?? []) out.push(`lose ${PROPS[p]?.name ?? p}`)
  for (const [k, v] of Object.entries(fx.skill ?? {})) out.push(`${sgn(v)} ${SKILLS[k]?.name ?? k}`)
  for (const o of fx.obl ?? []) out.push(`new duty: ${OBLS[o]?.name ?? o}`)
  for (const o of fx.free ?? []) out.push(`ends: ${OBLS[o]?.name ?? o}`)
  return out
}

// ---------- applying effects ----------

function applyFx(d: GameState, fx: Fx, e: HistoryEntry) {
  const dl = e.d
  if (fx.m) {
    const b = d.money
    d.money = clamp(d.money + fx.m, 0, CAP.money)
    dl.m += d.money - b
  }
  if (fx.h) {
    const b = d.char.health
    d.char.health = clamp(d.char.health + fx.h, 0, CAP.health)
    dl.h += d.char.health - b
  }
  if (fx.k) {
    const b = d.char.knowledge
    d.char.knowledge = clamp(d.char.knowledge + fx.k, 0, CAP.knowledge)
    d.char.peakK = Math.max(d.char.peakK, d.char.knowledge)
    dl.k += d.char.knowledge - b
  }
  if (fx.b) {
    const b = d.bonds
    d.bonds = clamp(d.bonds + fx.b, 0, CAP.bonds)
    dl.b += d.bonds - b
  }
  if (fx.debt) {
    const b = d.debt
    d.debt = clamp(d.debt + fx.debt, 0, CAP.debt)
    dl.debt += d.debt - b
    if (fx.debt > 0) d.cause['debt'] = e.id
  }
  for (let f of fx.flags ?? []) {
    if (f === 'child_apprenticed_best') {
      const best = Object.entries(d.char.skills).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
      f = `child_apprenticed_${best ? best[0] : 'craft'}`
    }
    if (!d.flags.includes(f)) d.flags.push(f)
    d.cause[`flag:${f}`] = e.id
    e.flagsSet.push(f)
  }
  for (const f of fx.clear ?? []) {
    d.flags = d.flags.filter((x) => x !== f)
    delete d.cause[`flag:${f}`]
  }
  for (const p of fx.gain ?? []) {
    if (!d.props.includes(p)) {
      d.props.push(p)
      e.gained.push(p)
    }
    d.cause[`prop:${p}`] = e.id
    if (p === 'cottage' && d.obl.includes('rent')) {
      d.obl = d.obl.filter((o) => o !== 'rent')
      e.oblFree.push('rent')
    }
  }
  for (const p of fx.lose ?? []) {
    if (d.props.includes(p)) {
      d.props = d.props.filter((x) => x !== p)
      e.lost.push(p)
    }
    d.cause[`prop:${p}`] = e.id
  }
  for (const [k, v] of Object.entries(fx.skill ?? {})) {
    d.char.skills[k] = clamp((d.char.skills[k] ?? 0) + v, 0, 3)
  }
  for (const o of fx.obl ?? []) {
    if (!d.obl.includes(o)) d.obl.push(o)
    d.cause[`obl:${o}`] = e.id
    e.oblAdd.push(o)
  }
  for (const o of fx.free ?? []) {
    d.obl = d.obl.filter((x) => x !== o)
    e.oblFree.push(o)
  }
  for (const sc of fx.sched ?? []) {
    const gen = d.gen + (sc.gen ?? 0)
    const minTurn = sc.gen ? Math.max(1, sc.delay ?? 1) : d.turn + (sc.delay ?? 1)
    if (gen <= MAX_GEN) d.queue.push({ ev: sc.ev, gen, minTurn, cause: e.id })
  }
  if (d.char.health <= 0) d.char.died = true
}

// ---------- the choice step ----------

export function choose(s: GameState, optId: string): GameState {
  if (s.phase !== 'choose' || !s.current) throw new Error('No choice pending')
  const d = structuredClone(s)
  const ev = EVENTS[d.current!.ev]
  const opt = ev.options.find((o) => o.id === optId)
  if (!opt) throw new Error(`Unknown option ${optId}`)
  const st = optionStatus(d, opt)
  if (!st.ok) throw new Error(`Option unavailable: ${st.reason}`)
  const e: HistoryEntry = {
    id: d.history.length, gen: d.gen, turn: d.turn, ev: ev.id, evTitle: ev.title, opt: opt.id, optLabel: opt.label,
    result: '', failed: false, d: zeroDelta(), flagsSet: [], gained: [], lost: [], oblAdd: [], oblFree: [],
    causes: d.current!.causes, key: !!opt.key,
  }
  let fx = opt.fx
  let result = opt.result
  if (opt.risk) {
    const r = rand(d)
    if (r >= opt.risk.p) {
      fx = opt.risk.fail
      result = opt.risk.failResult
      e.failed = true
      e.key = true
    }
  }
  e.result = fill(d, result)
  d.history.push(e)
  applyFx(d, fx, e)
  if (!ev.repeatable) d.used.push(ev.id)
  d.themes.push(ev.theme)
  d.lastEntry = e.id
  d.turn += 1
  d.phase = 'result'
  return d
}

// ---------- ledger ----------

function runLedger(d: GameState): GameState {
  const lines: LedgerLine[] = []
  const before = { money: d.money, debt: d.debt }
  let income = 0
  const shared = d.flags.includes('shared_estate')
  const propLines: LedgerLine[] = []
  for (const p of d.props) {
    const def = PROPS[p]
    let y = def.yield
    if (def.bonusSkill && (d.char.skills[def.bonusSkill] ?? 0) >= 1 && y > 0) y += 1
    if (y > 0) propLines.push({ label: def.name, m: y, h: 0, b: 0, debt: 0 })
    income += y
  }
  if (shared && income > 0) {
    const half = Math.floor(income / 2)
    lines.push(...propLines)
    lines.push({ label: 'Shared estate — siblings take their half', m: half - income, h: 0, b: 0, debt: 0 })
  } else lines.push(...propLines)
  for (const o of d.obl) {
    const def = OBLS[o]
    if (!def) continue
    lines.push({ label: def.name, m: def.per.m ?? 0, h: def.per.h ?? 0, b: def.per.b ?? 0, debt: 0 })
  }
  lines.push({ label: 'Busy lives pull the family apart', m: 0, h: 0, b: -1, debt: 0 })
  if (d.debt > 0) lines.push({ label: `Interest on ${d.debt} debt`, m: -Math.ceil(d.debt / 3), h: 0, b: 0, debt: 0 })
  let net = lines.reduce((a, l) => a + l.m, 0)
  let note: string | undefined
  if (d.money + net < 0) {
    const short = -(d.money + net)
    const extra = Math.max(1, Math.ceil(short / 2))
    lines.push({ label: `Short ${short} coin — borrowed to cover it`, m: 0, h: 0, b: 0, debt: extra })
    net = -d.money
    d.debt = clamp(d.debt + extra, 0, CAP.debt)
  }
  const rawMoney = d.money + net
  d.money = clamp(rawMoney, 0, CAP.money)
  if (rawMoney > CAP.money) note = `Surplus beyond ${CAP.money} coin is spent on the household and does not carry forward.`
  const hb = lines.reduce((a, l) => a + l.h, 0)
  const bb = lines.reduce((a, l) => a + l.b, 0)
  d.char.health = clamp(d.char.health + hb, 1, CAP.health)
  d.bonds = clamp(d.bonds + bb, 0, CAP.bonds)
  const ledger: Ledger = { lines, note, before, after: { money: d.money, debt: d.debt } }
  d.ledger = ledger
  d.phase = 'ledger'
  return d
}

// ---------- advancing ----------

export function advance(s: GameState): GameState {
  const d = structuredClone(s)
  if (d.phase === 'result') {
    if (d.char.died) return endGeneration(d)
    if (LEDGER_AFTER.includes(d.turn)) return runLedger(d)
    return nextEvent(d)
  }
  if (d.phase === 'ledger') {
    if (d.turn >= DECISIONS_PER_GEN) return endGeneration(d)
    return nextEvent(d)
  }
  throw new Error(`Cannot advance from ${d.phase}`)
}

function endGeneration(d: GameState): GameState {
  d.char.endHealth = d.char.health
  d.char.endMoney = d.money
  d.past.push(structuredClone(d.char))
  d.genKnowledgePeaks.push(d.char.peakK)
  d.current = null
  d.ledger = null
  if (d.gen >= MAX_GEN) {
    d.phase = 'ended'
    return d
  }
  d.heirOptions = computeHeirOptions(d)
  d.phase = 'heir'
  return d
}

// ---------- heirs ----------

function skillsPassedDown(sk: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(sk)) if (v >= 2) out[k] = v - 1
  return out
}

export function computeHeirOptions(d: GameState): HeirOption[] {
  const homeOwned = d.props.filter((p) => HOMES.includes(p))
  const sellable = d.props.filter((p) => !HOMES.includes(p))
  const sellValue = sellable.reduce((a, p) => a + PROPS[p].value, 0)
  const schooled = d.flags.includes('child_schooled')
  const canScholar = d.char.peakK >= 5 || schooled || d.money >= 5
  const canShare = d.bonds >= 4
  return [
    {
      dir: 'steward', title: 'Keep the house and the trade',
      summary: 'One child stays and takes on everything: property, debts and duties.',
      available: true,
      effects: ['Inherits all property, debt and duties', 'Skills you hold at level 2–3 pass down one level lower', 'Bonds fade by 1 with the generation'],
    },
    {
      dir: 'scholar', title: 'Send the clever one away to learn',
      summary: `Sell what is not a home${sellable.length ? ` (${sellable.map((p) => PROPS[p].name).join(', ')} — about ${sellValue} coin)` : ''} and pay for a serious education.`,
      available: canScholar,
      reason: canScholar ? undefined : 'Needs a way to pay or a ready student: knowledge 5+ at some point, a schooled child, or 5 coin.',
      effects: [`Sells ${sellable.length ? 'non-home property' : 'nothing (no property to sell)'}; proceeds repay debt first`, 'Heir starts with +2 knowledge and some Letters', homeOwned.length ? 'Keeps the home' : 'Duties stay with the heir'],
    },
    {
      dir: 'share', title: 'Divide the estate among the children',
      summary: 'Everyone gets something. Nobody is left out, and nobody is left with much.',
      available: canShare,
      reason: canShare ? undefined : 'The family is too frayed to divide peacefully (needs bonds 4+).',
      effects: ['Property stays, but siblings take half of its income for the next generation', 'Debt is split: halved (rounded up)', 'Bonds +1 instead of fading'],
    },
  ]
}

export function chooseHeir(s: GameState, dir: HeirDir): GameState {
  if (s.phase !== 'heir') throw new Error('No heir to choose')
  const opt = s.heirOptions.find((o) => o.dir === dir)
  if (!opt || !opt.available) throw new Error('Heir option unavailable')
  const d = structuredClone(s)
  const prev = d.char
  const notes: string[] = []
  const e: HistoryEntry = {
    id: d.history.length, gen: d.gen, turn: DECISIONS_PER_GEN, ev: '_heir', evTitle: 'Passing the house on',
    opt: dir, optLabel: opt.title, result: '', failed: false, d: zeroDelta(), flagsSet: [], gained: [], lost: [],
    oblAdd: [], oblFree: [], causes: [], key: true,
  }
  // household effects
  d.flags = d.flags.filter((f) => !f.startsWith('dir_') && f !== 'early_orphan' && f !== 'shared_estate')
  const debtBefore = d.debt
  const moneyBefore = d.money
  const lostProps: string[] = []
  let sk: Record<string, number> = skillsPassedDown(prev.skills)
  let bonus = 0
  if (dir === 'steward') {
    d.bonds = Math.max(2, d.bonds - 1)
  } else if (dir === 'scholar') {
    const sell = d.props.filter((p) => !HOMES.includes(p))
    let proceeds = 0
    for (const p of sell) {
      proceeds += PROPS[p].value
      lostProps.push(p)
      d.cause[`prop:${p}`] = e.id
    }
    d.props = d.props.filter((p) => !sell.includes(p))
    const repay = Math.min(d.debt, proceeds)
    d.debt -= repay
    d.money = clamp(d.money + proceeds - repay, 0, CAP.money)
    d.bonds = Math.max(2, d.bonds - 1)
    sk = { letters: Math.min(3, (sk.letters ?? 0) + 1) }
    bonus = 2
    if (sell.length) notes.push(`The family sold ${sell.map((p) => PROPS[p].name).join(' and ')} to pay for the schooling.`)
  } else {
    d.debt = Math.ceil(d.debt / 2)
    d.bonds = clamp(d.bonds + 1, 0, CAP.bonds)
    d.flags.push('shared_estate')
    const top = Object.entries(prev.skills).sort((a, b) => b[1] - a[1])[0]
    sk = top && top[1] >= 2 ? { [top[0]]: top[1] - 1 } : {}
  }
  e.lost = lostProps
  e.d.debt = d.debt - debtBefore
  e.d.m = d.money - moneyBefore
  d.flags.push(`dir_${dir}`)
  d.cause[`flag:dir_${dir}`] = e.id
  e.flagsSet.push(`dir_${dir}`)
  if (dir === 'share') {
    d.cause['flag:shared_estate'] = e.id
    e.flagsSet.push('shared_estate')
  }
  const died = prev.died
  if (died) {
    d.flags.push('early_orphan')
    d.cause['flag:early_orphan'] = e.id
    e.flagsSet.push('early_orphan')
  }
  // new character — how upbringing shapes them (each line is shown to the player)
  let health = 7
  notes.push('Health begins at a baseline of 7 — it does not pass from parent to child.')
  if (d.money >= 7) { health += 1; notes.push('+1 health: raised well fed (the household had 7+ coin).') }
  if (d.money <= 1) { health -= 1; notes.push('−1 health: raised through lean years (the household had 1 coin or less).') }
  if (d.flags.includes('family_cough')) { health -= 1; notes.push('−1 health: the family cough settled in their chest.') }
  if (d.flags.includes('mark_well')) { health += 1; notes.push('+1 health: clean water from the Cross Street well.') }
  if (d.flags.includes('child_hardship')) { health -= 1; notes.push('−1 health: a hard childhood winter.') }
  if (died) { health -= 1; notes.push('−1 health: orphaned young.') }
  health = clamp(health, 4, 9)
  let knowledge = 1
  notes.push('Knowledge begins at 1 — what the heir knows comes from how they were raised.')
  if (d.flags.includes('child_schooled')) { knowledge += 2; notes.push('+2 knowledge: schooling the family paid for.') }
  if (d.props.includes('library')) { knowledge += 1; notes.push('+1 knowledge: grew up beside the Book room.') }
  if (prev.peakK >= 6) { knowledge += 1; notes.push('+1 knowledge: raised by a reader.') }
  if (d.flags.includes('mark_school')) { knowledge += 1; notes.push('+1 knowledge: a seat on the school bench the family helped build.') }
  if (bonus) { knowledge += bonus; notes.push(`+${bonus} knowledge: sent away to study.`) }
  knowledge = clamp(knowledge, 0, 7)
  for (const f of d.flags.filter((x) => x.startsWith('child_apprenticed_'))) {
    const skill = f.replace('child_apprenticed_', '')
    sk[skill] = clamp((sk[skill] ?? 0) + 1, 0, 3)
    notes.push(`+1 ${SKILLS[skill]?.name ?? skill}: apprenticed at the family’s side.`)
  }
  for (const [k, v] of Object.entries(sk)) {
    if (!notes.some((n) => n.includes(SKILLS[k]?.name ?? k)) && v > 0) notes.push(`${SKILLS[k]?.name ?? k} ${v}: absorbed from watching ${prev.name}.`)
  }
  d.flags = d.flags.filter((f) => !f.startsWith('child_'))
  if (dir === 'steward') notes.push('Property, debt and duties all pass to the heir.')
  if (dir === 'share') notes.push('Siblings take half of the estate’s income this generation; debt is halved; bonds rise by 1.')
  e.result = `${prev.name}’s family chose: ${opt.title}.`
  d.history.push(e)
  d.gen += 1
  d.turn = 0
  d.char = {
    name: nameFor(d, d.gen), gen: d.gen, health, knowledge, skills: sk, peakK: knowledge, notes, died: false, dir,
  }
  d.queue = d.queue.filter((q) => q.gen >= d.gen)
  d.heirOptions = []
  d.lastEntry = e.id
  return nextEvent(d)
}

export function currentEvent(s: GameState): EventDef | null {
  return s.current ? EVENTS[s.current.ev] : null
}

export function marksOf(s: GameState): string[] {
  return s.flags.filter((f) => f.startsWith('mark_'))
}

export function skillSummary(c: Char): string {
  const parts = Object.entries(c.skills).filter(([, v]) => v > 0).map(([k, v]) => `${SKILLS[k]?.name ?? k} ${v}`)
  return parts.length ? parts.join(', ') : 'no trained skill'
}

/** Test/debug helper: replace the pending event (keeps all other state). */
export function forceEvent(s: GameState, evId: string, schedCause?: number): GameState {
  const d = structuredClone(s)
  d.current = compose(d, EVENTS[evId], schedCause)
  d.phase = 'choose'
  d.ledger = null
  return d
}

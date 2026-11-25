// Core types for Inheritance: Three Generations.
// State ownership:
//   Character (dies with the generation): health, knowledge, skills.
//   Household (shared, carried forward): money, bonds, debt, property, obligations, flags.
//   Inherited by rule at a generation change (see engine/heirs.ts): property, debt, obligations,
//   flags (consequences), and — only through upbringing — a character's starting knowledge/skills/health.

export type Phase = 'youth' | 'prime' | 'late'

/** Requirement / eligibility test. All present fields must hold. */
export interface Req {
  m?: number // money >=
  mMax?: number // money <=
  h?: number // health >=
  k?: number // knowledge >=
  kMax?: number
  b?: number // bonds >=
  bMax?: number
  debt?: number // debt >=
  debtMax?: number // debt <=
  flags?: string[] // all present
  anyFlags?: string[] // at least one present
  no?: string[] // none present
  prop?: string[] // owns all
  noProp?: string[] // owns none
  anyProp?: string[] // owns at least one
  skill?: Record<string, number> // skill levels >=
  obl?: string[]
  noObl?: string[]
  gen?: number[]
  start?: string[]
}

export interface Sched {
  ev: string
  /** 0 = this generation, 1 = next generation, 2 = the one after */
  gen?: 0 | 1 | 2
  /** decisions to wait (minimum) */
  delay?: number
}

export interface Fx {
  m?: number
  h?: number
  k?: number
  b?: number
  debt?: number
  flags?: string[]
  clear?: string[]
  gain?: string[]
  lose?: string[]
  skill?: Record<string, number>
  obl?: string[]
  free?: string[]
  sched?: Sched[]
}

export interface Risk {
  p: number // probability the normal effects apply
  fail: Fx
  failResult: string
  failHint: string
}

export interface OptionDef {
  id: string
  label: string
  /** non-numeric stakes, one short line */
  hint: string
  req?: Req
  fx: Fx
  result: string
  risk?: Risk
  /** marks a turning point worth quoting in the family history */
  key?: boolean
}

export interface Callback {
  if: Req
  text: string
  /** cause key such as "flag:sold_workshop" or "prop:workshop" whose recorded entry is linked */
  cause?: string
}

export interface EventDef {
  id: string
  title: string
  art: string
  phase: Phase[]
  gens: number[]
  when?: Req
  weight: number
  theme: string
  text: string
  callbacks?: Callback[]
  /** cause key shown as "because …" if recorded */
  cause?: string
  options: OptionDef[]
  repeatable?: boolean
  /** only appears when scheduled by an earlier choice */
  chainOnly?: boolean
  /** chain label for tests/docs */
  chain?: string
}

export interface PropertyDef {
  id: string
  name: string
  desc: string
  icon: string
  yield: number
  bonusSkill?: string
  value: number // sale value in coin
}

export interface ObligationDef {
  id: string
  name: string
  desc: string
  per: { m?: number; h?: number; b?: number }
}

export interface StartDef {
  id: string
  family: string
  title: string
  blurb: string
  difficultyNote: string
  money: number
  bonds: number
  debt: number
  props: string[]
  obl: string[]
  flags: string[]
  health: number
  knowledge: number
  skills: Record<string, number>
  opener: string
  firstNames: string[]
}

export interface AmbitionDef {
  id: string
  title: string
  tagline: string
  rule: string
}

export interface Char {
  name: string
  gen: number
  health: number
  knowledge: number
  skills: Record<string, number>
  peakK: number
  /** explanations of how this character began (upbringing), shown on the transition screen */
  notes: string[]
  died: boolean
  dir?: HeirDir // how the inheritance passed *to* this character
  endHealth?: number
  endMoney?: number
}

export type HeirDir = 'steward' | 'scholar' | 'share'

export interface SchedItem {
  ev: string
  gen: number
  minTurn: number
  cause: number
}

export interface Delta {
  m: number
  h: number
  k: number
  b: number
  debt: number
}

export interface HistoryEntry {
  id: number
  gen: number
  turn: number
  ev: string
  evTitle: string
  opt: string
  optLabel: string
  result: string
  failed: boolean
  d: Delta
  flagsSet: string[]
  gained: string[]
  lost: string[]
  oblAdd: string[]
  oblFree: string[]
  causes: number[]
  key: boolean
}

export interface LedgerLine {
  label: string
  m: number
  h: number
  b: number
  debt: number
}

export interface Ledger {
  lines: LedgerLine[]
  note?: string
  before: { money: number; debt: number }
  after: { money: number; debt: number }
}

export interface HeirOption {
  dir: HeirDir
  title: string
  summary: string
  available: boolean
  reason?: string
  effects: string[]
}

export type GamePhase = 'choose' | 'result' | 'ledger' | 'heir' | 'ended'

export interface CurrentEvent {
  ev: string
  text: string
  extras: string[]
  causeLines: string[]
  causes: number[]
}

export interface GameState {
  v: 1
  seed: number
  rng: number
  startId: string
  ambitionId: string
  gen: number
  turn: number // decisions completed this generation
  phase: GamePhase
  money: number
  bonds: number
  debt: number
  props: string[]
  obl: string[]
  flags: string[]
  char: Char
  past: Char[]
  queue: SchedItem[]
  used: string[]
  themes: string[]
  history: HistoryEntry[]
  cause: Record<string, number>
  current: CurrentEvent | null
  lastEntry: number | null
  ledger: Ledger | null
  heirOptions: HeirOption[]
  /** per generation: ambition-relevant snapshots */
  genKnowledgePeaks: number[]
  startProps: string[]
}

export interface Thread {
  sentences: string[]
  generations: number
}

export interface Ending {
  profileId: string
  title: string
  blurb: string
  ambition: { id: string; title: string; met: boolean; conds: { label: string; ok: boolean }[] }
  generations: GenSummary[]
  threads: Thread[]
  facts: string[]
  stats: { money: number; bonds: number; debt: number; props: string[]; marks: number; peakKnowledge: number }
}

export interface GenSummary {
  gen: number
  name: string
  epithet: string
  died: boolean
  endHealth: number
  endKnowledge: number
  peakKnowledge: number
  skills: Record<string, number>
  dir?: HeirDir
  keyChoices: string[]
  family?: string
}

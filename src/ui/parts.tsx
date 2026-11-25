import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './icons'
import { FLAG_DISPLAY, MARK_LABELS, OBLS, PROPS, SKILLS, STARTS } from '../content/catalog'
import { epithetFor, ambitionStatus } from '../engine/endings'
import { DECISIONS_PER_GEN, skillSummary } from '../engine/engine'
import { DIR_LABEL } from './legacy'
import type { Delta, GameState, GenSummary } from '../engine/types'

export const ROMAN = ['I', 'II', 'III']

/** Move focus to the heading of a newly shown stage so keyboard and screen-reader users land in the right place. */
export function useStageFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])
  return ref
}

/** Scroll to the top when a stage appears (focus stays on the primary button). */
export function useScrollTop() {
  useEffect(() => { window.scrollTo({ top: 0 }) }, [])
}

export function Meter({ kind, icon, label, value, max }: { kind: string; icon: string; label: string; value: number; max: number }) {
  return (
    <div className={`meter m-${kind}`} role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <Icon name={icon} size={20} />
      <div className="lab"><span>{label}</span></div>
      <span className="val">{value}</span>
      <div className="pips" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => <span key={i} className={`pip ${i < value ? 'on' : ''}`} />)}
      </div>
    </div>
  )
}

export function DeltaChips({ d, extra }: { d: Delta; extra?: ReactNode }) {
  const items: { t: string; cls: string; icon: string }[] = []
  const add = (n: number, label: string, icon: string, goodWhenPositive = true) => {
    if (!n) return
    const good = goodWhenPositive ? n > 0 : n < 0
    items.push({ t: `${n > 0 ? '+' : '−'}${Math.abs(n)} ${label}`, cls: good ? 'pos' : 'neg', icon })
  }
  add(d.m, 'coin', 'coin')
  add(d.h, 'health', 'health')
  add(d.k, 'knowledge', 'knowledge')
  add(d.b, 'bonds', 'bonds')
  add(d.debt, 'debt', 'debt', false)
  return (
    <ul className="chips" aria-label="Effects">
      {items.map((i) => <li key={i.t} className={`chip ${i.cls}`}><Icon name={i.icon} size={12} />{i.t}</li>)}
      {extra}
    </ul>
  )
}

export function Hud({ g }: { g: GameState }) {
  const st = STARTS[g.startId]
  const marks = g.flags.filter((f) => f.startsWith('mark_'))
  const threads = g.flags.filter((f) => FLAG_DISPLAY[f])
  const amb = ambitionStatus(g)
  const causeTitle = (key: string) => {
    const id = g.cause[key]
    const e = id !== undefined ? g.history[id] : undefined
    return e ? `Since generation ${e.gen}: “${e.optLabel}” (“${e.evTitle}”)` : undefined
  }
  return (
    <aside className="side" aria-label="The family">
      <section className="card" aria-labelledby="hud-char">
        <div className="eyebrow">Generation {ROMAN[g.gen - 1]} of III — {st.family} family</div>
        <div className="charname" id="hud-char">{g.char.name} <span className="small">{epithetFor(g.char)}</span></div>
        <div className="small">Decision {Math.min(g.turn + (g.phase === 'choose' ? 1 : 0), DECISIONS_PER_GEN)} of {DECISIONS_PER_GEN}</div>
        <Meter kind="health" icon="health" label="Health" value={g.char.health} max={10} />
        <Meter kind="knowledge" icon="knowledge" label="Knowledge" value={g.char.knowledge} max={10} />
        <div className="small">Skills: {skillSummary(g.char)}</div>
        <div className="panel-title">Household</div>
        <Meter kind="money" icon="coin" label="Coin" value={g.money} max={12} />
        <Meter kind="bonds" icon="bonds" label="Family bonds" value={g.bonds} max={10} />
        {g.debt > 0 && <Meter kind="debt" icon="debt" label="Debt" value={g.debt} max={10} />}
        <div className="panel-title">Property</div>
        {g.props.length ? (
          <ul className="tagrow">{g.props.map((p) => <li key={p} className="tag prop" title={PROPS[p].desc}><Icon name={PROPS[p].icon} size={14} />{PROPS[p].name}</li>)}</ul>
        ) : <div className="small">None. The family owns no property.</div>}
        {g.obl.length > 0 && <>
          <div className="panel-title">Duties</div>
          <ul className="tagrow">{g.obl.map((o) => <li key={o} className="tag duty" title={OBLS[o].desc}><Icon name="scroll" size={14} />{OBLS[o].name}</li>)}</ul>
        </>}
        {(threads.length > 0 || marks.length > 0) && <>
          <div className="panel-title">Standing consequences</div>
          <ul className="tagrow">
            {threads.map((f) => <li key={f} className="tag" title={causeTitle(`flag:${f}`)}><Icon name="thread" size={14} />{FLAG_DISPLAY[f]}</li>)}
            {marks.map((f) => <li key={f} className="tag" title={causeTitle(`flag:${f}`)}><Icon name="bell" size={14} />Mark: {MARK_LABELS[f]}</li>)}
          </ul>
        </>}
      </section>
      <section className="card" aria-labelledby="hud-amb">
        <div className="eyebrow">Family ambition</div>
        <h3 id="hud-amb">{ambitionTitle(g.ambitionId)}</h3>
        <ul className="checklist">
          {amb.conds.map((c) => <li key={c.label}><Icon name={c.ok ? 'check' : 'close'} size={16} /><span className={c.ok ? 'ok' : 'no'}>{c.label}</span></li>)}
        </ul>
        <div className="small">Judged at the end of generation III.</div>
      </section>
      <section className="card" aria-label="Family tree"><div className="eyebrow">Family tree</div><MiniTree g={g} /></section>
    </aside>
  )
}

import { AMBITIONS } from '../content/catalog'
export const ambitionTitle = (id: string) => AMBITIONS[id].title

export function CompactHud({ g }: { g: GameState }) {
  return (
    <div className="compact-hud" role="group" aria-label="Resources">
      <span><Icon name="coin" size={16} />{g.money}<span className="sr-only"> coin</span></span>
      <span><Icon name="health" size={16} />{g.char.health}<span className="sr-only"> health</span></span>
      <span><Icon name="knowledge" size={16} />{g.char.knowledge}<span className="sr-only"> knowledge</span></span>
      <span><Icon name="bonds" size={16} />{g.bonds}<span className="sr-only"> family bonds</span></span>
      {g.debt > 0 && <span><Icon name="debt" size={16} />{g.debt}<span className="sr-only"> debt</span></span>}
    </div>
  )
}

export function MiniTree({ g }: { g: GameState }) {
  const slots = [0, 1, 2].map((i) => {
    const gen = i + 1
    const past = g.past.find((c) => c.gen === gen)
    const cur = g.char.gen === gen && !past ? g.char : undefined
    const c = past ?? cur
    return { gen, c, status: past ? 'done' : cur ? 'current' : 'future' }
  })
  return (
    <div className="tree">
      {slots.map((s, i) => (
        <div key={s.gen} style={{ width: '100%', display: 'grid', justifyItems: 'center' }}>
          {i > 0 && <>
            <div className="tlink" aria-hidden="true" />
            <div className="tlabel">{slots[i].c?.dir ? DIR_LABEL[slots[i].c!.dir!] : 'to be decided'}</div>
            <div className="tlink" aria-hidden="true" />
          </>}
          <div className={`tnode ${s.status} ${s.c?.died ? 'died' : ''}`} aria-current={s.status === 'current' ? 'step' : undefined}>
            <span className="num">{ROMAN[i]}</span>
            <span className="nm">{s.c ? s.c.name : 'Not yet born'}</span>
            <span className="ep">{s.c ? epithetFor(s.c) : 'The next generation'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function BigTree({ gens }: { gens: GenSummary[] }) {
  return (
    <div className="tree">
      {gens.map((g, i) => (
        <div key={g.gen} style={{ width: '100%', display: 'grid', justifyItems: 'center' }}>
          {i > 0 && <>
            <div className="tlink" aria-hidden="true" />
            <div className="tlabel">{g.dir ? DIR_LABEL[g.dir] : ''}</div>
            <div className="tlink" aria-hidden="true" />
          </>}
          <div className={`tnode ${g.died ? 'died' : ''}`}>
            <span className="num">{ROMAN[i]}</span>
            <span className="nm">{g.name} {g.family}</span>
            <span className="ep">{g.epithet}{g.keyChoices[0] ? ` · “${g.keyChoices[0]}”` : ''}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function skillsList(skills: Record<string, number>) {
  return Object.entries(skills).filter(([, v]) => v > 0).map(([k, v]) => `${SKILLS[k]?.name ?? k} ${v}`).join(', ') || 'none'
}

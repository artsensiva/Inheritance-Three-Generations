import { useEffect, useMemo, useState } from 'react'
import { Icon } from './icons'
import { BigTree, DeltaChips, ROMAN, ambitionTitle, skillsList, useScrollTop, useStageFocus } from './parts'
import { EVENTS } from '../content/events'
import { AMBITIONS, MARK_LABELS, OBLS, PROPS, STARTS, TOWN } from '../content/catalog'
import { DECISIONS_PER_GEN, fxChips, optionStatus, phaseOf } from '../engine/engine'
import { epithetFor, getEnding } from '../engine/endings'
import { legacySvg, savePng, svgDataUrl } from './legacy'
import { demoCardEnding } from './demo'
import { EVENT_LIST } from '../content/events'
import { BUY_PRICE, BUY_URL, DEMO, WISHLIST_URL } from '../config'
import type { GameState, HeirDir } from '../engine/types'

const PHASE_LABEL = { youth: 'Coming of age', prime: 'The working years', late: 'Later years' }

export function EventStage({ g, onChoose }: { g: GameState; onChoose: (id: string) => void }) {
  const ev = EVENTS[g.current!.ev]
  const ref = useStageFocus<HTMLHeadingElement>()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return
      if (document.querySelector('[role="dialog"]')) return
      const n = Number(e.key)
      if (n >= 1 && n <= ev.options.length) {
        const o = ev.options[n - 1]
        if (optionStatus(g, o).ok) { e.preventDefault(); onChoose(o.id) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [g, ev, onChoose])
  return (
    <article className="card tab rise" data-tab={`Gen ${ROMAN[g.gen - 1]} · ${PHASE_LABEL[phaseOf(g.turn)]}`} aria-labelledby="ev-title">
      <div className="event-head">
        <div className="roundel"><Icon name={ev.art} size={38} /></div>
        <div>
          <div className="eyebrow">Decision {g.turn + 1} of {DECISIONS_PER_GEN}</div>
          <h2 id="ev-title" ref={ref} tabIndex={-1}>{ev.title}</h2>
        </div>
      </div>
      {g.current!.causeLines.length > 0 && (
        <div className="because"><Icon name="thread" size={20} /><div><b>Because of an earlier choice</b>{g.current!.causeLines.map((l) => <div key={l}>{l}</div>)}</div></div>
      )}
      <p className="event-text">{g.current!.text}</p>
      {g.current!.extras.map((x) => <p key={x} className="remember">{x}</p>)}
      <div className="choices" role="group" aria-label="Your options">
        {ev.options.map((o, i) => {
          const st = optionStatus(g, o)
          const chips = fxChips(o.fx)
          return (
            <button key={o.id} className="choice" disabled={!st.ok} onClick={() => onChoose(o.id)} aria-keyshortcuts={String(i + 1)}>
              <span className="num" aria-hidden="true">{i + 1}</span>
              <span className="label">{o.label}</span>
              <span className="hint">{o.hint}</span>
              <span>
                <ul className="chips" aria-label="Expected effects">
                  {chips.map((c) => <li key={c} className={`chip ${/^\+|repay|gain|ends/.test(c) ? 'pos' : 'neg'}`}>{c}</li>)}
                  {o.risk && <li className="chip risk"><Icon name="dice" size={12} />Risky · about {Math.round(o.risk.p * 100)}% to work out</li>}
                  {(o.fx.sched?.length ?? 0) > 0 && <li className="chip neu"><Icon name="echo" size={12} />May come back to you</li>}
                </ul>
                {o.risk && <span className="small">If it fails: {o.risk.failHint}</span>}
                {!st.ok && <span className="why"><Icon name="lock" size={14} />{st.reason}</span>}
              </span>
            </button>
          )
        })}
      </div>
      <p className="small" style={{ marginTop: 12 }}>Tip: press 1, 2 or 3 to choose.</p>
    </article>
  )
}

export function ResultStage({ g, onContinue }: { g: GameState; onContinue: () => void }) {
  const e = g.history[g.lastEntry!]
  useScrollTop()
  const ev = EVENTS[e.ev]
  const opt = ev?.options.find((o) => o.id === e.opt)
  const echo = opt && ((opt.fx.sched?.length ?? 0) > 0 || (e.failed && (opt.risk?.fail.sched?.length ?? 0) > 0))
  return (
    <article className="card tab rise" data-tab="What happened" aria-labelledby="res-title">
      <div className="eyebrow">{e.evTitle}</div>
      <h2 id="res-title">{e.optLabel}</h2>
      <p className="result-text" role="status">{e.result}</p>
      {e.failed && <p className="small"><Icon name="dice" size={14} /> The risk did not pay off this time.</p>}
      <DeltaChips d={e.d} extra={<>
        {e.gained.map((p) => <li key={p} className="chip pos"><Icon name="house" size={12} />Gained: {PROPS[p].name}</li>)}
        {e.lost.map((p) => <li key={p} className="chip neg"><Icon name="house" size={12} />Lost: {PROPS[p].name}</li>)}
        {e.oblAdd.map((o) => <li key={o} className="chip neg"><Icon name="scroll" size={12} />New duty: {OBLS[o].name}</li>)}
        {e.oblFree.map((o) => <li key={o} className="chip pos"><Icon name="check" size={12} />Ended: {OBLS[o]?.name ?? o}</li>)}
      </>} />
      {echo && <p className="small" style={{ marginTop: 10 }}><Icon name="echo" size={14} /> This choice will echo later — in this generation or the next.</p>}
      {g.char.died && <p className="because"><Icon name="candle" size={20} /><span>{g.char.name} did not recover. The generation ends here, and the family carries on without them.</span></p>}
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn primary" onClick={onContinue} autoFocus>Continue <Icon name="arrow" size={18} /></button>
      </div>
    </article>
  )
}

export function LedgerStage({ g, onContinue }: { g: GameState; onContinue: () => void }) {
  const l = g.ledger!
  useScrollTop()
  const net = l.lines.reduce((a, x) => a + x.m, 0)
  return (
    <article className="card tab rise" data-tab="The ledger" aria-labelledby="led-title">
      <div className="eyebrow">Seasons turn</div>
      <h2 id="led-title">The Household Ledger</h2>
      <p>What the property earns, what the duties cost, and what the years do to a family.</p>
      <table className="ledger">
        <thead><tr><th scope="col">Item</th><th scope="col" className="n">Coin</th><th scope="col" className="n">Health</th><th scope="col" className="n">Bonds</th><th scope="col" className="n">Debt</th></tr></thead>
        <tbody>
          {l.lines.map((x, i) => (
            <tr key={i}><td>{x.label}</td><Cell n={x.m} /><Cell n={x.h} /><Cell n={x.b} /><Cell n={x.debt} bad /></tr>
          ))}
          {l.lines.length === 0 && <tr><td colSpan={5}>Nothing coming in, nothing going out.</td></tr>}
        </tbody>
        <tfoot><tr><th scope="row">Coin: {l.before.money} → {l.after.money}</th><td colSpan={4} className="n">Net {net >= 0 ? '+' : '−'}{Math.abs(net)} coin{l.before.debt !== l.after.debt ? ` · debt ${l.before.debt} → ${l.after.debt}` : ''}</td></tr></tfoot>
      </table>
      {l.note && <p className="small">{l.note}</p>}
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn primary" onClick={onContinue} autoFocus>Continue <Icon name="arrow" size={18} /></button>
      </div>
    </article>
  )
}
function Cell({ n, bad }: { n: number; bad?: boolean }) {
  if (!n) return <td className="n small">—</td>
  const good = bad ? n < 0 : n > 0
  return <td className={`n ${good ? 'pos-t' : 'neg-t'}`}>{n > 0 ? '+' : '−'}{Math.abs(n)}</td>
}

export function IntroStage({ g, onBegin }: { g: GameState; onBegin: () => void }) {
  useScrollTop()
  const st = STARTS[g.startId]
  const first = g.gen === 1
  return (
    <article className="card tab rise" data-tab={`Generation ${ROMAN[g.gen - 1]}`} aria-labelledby="intro-title">
      <div className="eyebrow">{first ? `${TOWN} — a fictional town in a fictional era` : `${st.family} family — generation ${ROMAN[g.gen - 1]}`}</div>
      <h2 id="intro-title">{first ? st.title : `${g.char.name} takes the lead`}</h2>
      {first ? <>
        <p>{st.blurb}</p>
        <p><b>{g.char.name}</b> begins with {g.money} coin, {g.char.health} health, {g.char.knowledge} knowledge and {skillsList(g.char.skills)}. {g.props.length ? `The family holds: ${g.props.map((p) => PROPS[p].name).join(', ')}.` : 'The family holds no property.'} {g.debt ? `It owes ${g.debt} to the Lantern Bank.` : ''}</p>
        <p>{DEMO ? `In this demo you make ${DECISIONS_PER_GEN} decisions for generation I, then choose what the next generation inherits.` : `You will make ${DECISIONS_PER_GEN} decisions for each of three generations.`} Every choice leaves something behind: property, debt, duties, skills, and consequences that find the next generation. Your family ambition is <b>{ambitionTitle(g.ambitionId)}</b>: {AMBITIONS[g.ambitionId].rule}</p>
      </> : <>
        <p>Here is how {g.char.name} begins — rebuilt from the way they were raised, not copied from their parent.</p>
        <ul className="notes">{g.char.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        <p>Health <b>{g.char.health}</b> · Knowledge <b>{g.char.knowledge}</b> · Skills: {skillsList(g.char.skills)}</p>
        <p>
          The family now holds {g.props.length ? g.props.map((p) => PROPS[p].name).join(', ') : 'no property'}; {g.debt ? `owes ${g.debt}` : 'owes nothing'}; and carries {g.obl.length ? g.obl.map((o) => OBLS[o].name).join(', ') : 'no standing duties'}.
        </p>
      </>}
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn primary" onClick={onBegin} autoFocus>{first ? 'Begin' : 'Begin generation ' + ROMAN[g.gen - 1]} <Icon name="arrow" size={18} /></button>
      </div>
    </article>
  )
}

export function HeirStage({ g, onPick, demo }: { g: GameState; onPick: (d: HeirDir) => void; demo?: boolean }) {
  const ref = useStageFocus<HTMLHeadingElement>()
  const c = g.past[g.past.length - 1]
  return (
    <article className="card tab rise" data-tab="Passing the house on" aria-labelledby="heir-title">
      <div className="eyebrow">{c.died ? `${c.name} was lost before their time` : `${c.name}'s years are done`}</div>
      <h2 id="heir-title" ref={ref} tabIndex={-1}>What does the next generation inherit?</h2>
      <p>
        {c.name}, {epithetFor(c)}, leaves the household with {g.money} coin, {g.bonds} bonds
        {g.debt ? `, ${g.debt} debt` : ''}, {g.props.length ? g.props.map((p) => PROPS[p].name).join(' and ') : 'no property'}
        {g.obl.length ? ` and the duties: ${g.obl.map((o) => OBLS[o].name).join(', ')}` : ''}. Health and knowledge stay with {c.name}: the heir’s are built from how they were raised.
      </p>
      {demo && <p className="demo-note">In the demo the story pauses once you choose. The next screen shows exactly what the next generation inherits.</p>}
      <div className="heirs">
        {g.heirOptions.map((o) => (
          <button key={o.dir} className="heir" disabled={!o.available} onClick={() => onPick(o.dir)}>
            <span className="title">{o.title}</span>
            <span>{o.summary}</span>
            <ul>{o.effects.map((e) => <li key={e}>{e}</li>)}</ul>
            {!o.available && <span className="why" style={{ marginTop: 8, color: 'var(--brick)' }}><Icon name="lock" size={14} /> {o.reason}</span>}
          </button>
        ))}
      </div>
    </article>
  )
}

export function EndingStage({ g, onReplay, onSameFamily, onTitle }: { g: GameState; onReplay: () => void; onSameFamily: () => void; onTitle: () => void }) {
  const ref = useStageFocus<HTMLHeadingElement>()
  const e = useMemo(() => getEnding(g), [g])
  const family = STARTS[g.startId].family
  const svg = useMemo(() => legacySvg(family, e), [family, e])
  const [msg, setMsg] = useState('')
  const save = async () => {
    try {
      await savePng(svg, `inheritance-${family.toLowerCase()}-line.png`)
      setMsg('Saved the legacy card as an image.')
    } catch (err) {
      setMsg(`Could not export the image (${(err as Error).message}). You can still right-click the card to save it.`)
    }
  }
  const marks = g.flags.filter((f) => f.startsWith('mark_'))
  return (
    <div className="rise">
      <article className="card tab" data-tab="The family’s story" aria-labelledby="end-title">
        <div className="eyebrow">{family} family · {TOWN}</div>
        <h2 id="end-title" ref={ref} tabIndex={-1}>{e.title}</h2>
        <p className="event-text">{e.blurb}</p>
        <div className="stat-row" aria-label="Final household">
          <span><Icon name="coin" size={16} />{e.stats.money} coin</span>
          <span><Icon name="bonds" size={16} />{e.stats.bonds} bonds</span>
          <span><Icon name="debt" size={16} />{e.stats.debt} debt</span>
          <span><Icon name="house" size={16} />{e.stats.props.length ? e.stats.props.map((p) => PROPS[p].name).join(', ') : 'no property'}</span>
          <span><Icon name="knowledge" size={16} />best knowledge {e.stats.peakKnowledge}</span>
        </div>
        <div className="because" style={{ borderColor: e.ambition.met ? 'var(--moss)' : 'var(--brick)', background: e.ambition.met ? 'rgba(79,111,50,0.08)' : undefined }}>
          <Icon name={e.ambition.met ? 'check' : 'close'} size={22} />
          <div>
            <b>Ambition — {e.ambition.title}: {e.ambition.met ? 'fulfilled' : 'not this time'}</b>
            <ul className="checklist">{e.ambition.conds.map((c) => <li key={c.label}><Icon name={c.ok ? 'check' : 'close'} size={16} /><span className={c.ok ? 'ok' : 'no'}>{c.label}</span></li>)}</ul>
          </div>
        </div>
      </article>
      <div className="ending-grid" style={{ marginTop: 22 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <section className="card" aria-labelledby="tree-h"><h3 id="tree-h">The family tree</h3><BigTree gens={e.generations} /></section>
          <section className="card" aria-labelledby="thr-h">
            <h3 id="thr-h">Threads of cause</h3>
            {e.threads.length ? e.threads.map((t, i) => (
              <div className="thread" key={i}>{t.sentences.map((s) => <p key={s}>{s}</p>)}</div>
            )) : <p className="small">No choice in this run reached forward to a later event. Try taking the risks and loans that echo.</p>}
          </section>
          <section className="card" aria-labelledby="fact-h">
            <h3 id="fact-h">How the family got here</h3>
            <ul className="notes">
              {e.facts.map((f) => <li key={f}>{f}</li>)}
              {marks.length === 0 && <li>The family left no mark on the town’s stones.</li>}
            </ul>
            {marks.length > 0 && <p className="small">Town marks: {marks.map((m) => MARK_LABELS[m]).join(', ')}.</p>}
          </section>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <img className="legacy-preview" src={svgDataUrl(svg)} alt={`Legacy card for the ${family} family: ${e.title}. ${e.generations.map((x) => `${x.name}, ${x.epithet}`).join('; ')}.`} />
          <div className="actions" style={{ margin: 0, justifyContent: 'flex-start' }}>
            <button className="btn primary" onClick={save}><Icon name="download" size={18} />Save legacy card (PNG)</button>
          </div>
          <p className="small" role="status">{msg}</p>
          <div className="actions" style={{ margin: 0, justifyContent: 'flex-start' }}>
            <button className="btn" onClick={onReplay}><Icon name="dice" size={18} />New family, new run</button>
            <button className="btn" onClick={onSameFamily}>Same family, other strategy</button>
            <button className="btn ghost" onClick={onTitle}>Title</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DemoEndStage({ g, onSameSeed, onNewRun }: { g: GameState; onSameSeed: () => void; onNewRun: () => void }) {
  const ref = useStageFocus<HTMLHeadingElement>()
  const family = STARTS[g.startId].family
  const ending = useMemo(() => demoCardEnding(g), [g])
  const svg = useMemo(() => legacySvg(family, ending, { demo: true }), [family, ending])
  const [msg, setMsg] = useState('')
  const dir = g.char.dir
  const save = async () => {
    try {
      await savePng(svg, `inheritance-${family.toLowerCase()}-generation-1.png`)
      setMsg('Saved the card as an image.')
    } catch (err) {
      setMsg(`Could not export the image (${(err as Error).message}).`)
    }
  }
  return (
    <article className="card tab rise" data-tab="End of the demo" aria-labelledby="demo-end-title">
      <div className="eyebrow">{family} family · generation II begins</div>
      <h2 id="demo-end-title" ref={ref} tabIndex={-1}>This is what {g.char.name} inherits</h2>
      <p>Your choices in generation I decided the state of the household. Here is what carried forward, and how the heir was rebuilt:</p>
      <ul className="notes">{g.char.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <p>
        <b>{g.char.name}</b> starts with health <b>{g.char.health}</b>, knowledge <b>{g.char.knowledge}</b>; the family holds{' '}
        {g.props.length ? g.props.map((p) => PROPS[p].name).join(', ') : 'no property'}, owes {g.debt}, and carries{' '}
        {g.obl.length ? g.obl.map((o) => OBLS[o].name).join(', ') : 'no standing duties'}.
        {dir === 'scholar' ? ' A child is sent away to study, and the house is lighter for it.' : dir === 'share' ? ' The estate is divided, so its income is halved for a generation.' : ' One child takes on the house, the trade and everything that comes with them.'}
      </p>
      <div className="demo-grid">
        <img className="legacy-preview" src={svgDataUrl(svg)} alt={`Card for the ${family} family after generation I.`} />
        <div>
          <h3>The full game continues</h3>
          <ul className="notes">
            <li>Two more generations, with the consequences of earlier choices coming back as events and options</li>
            <li>Three starting families, four ambitions, {EVENT_LIST.length} events, 12 endings</li>
            <li>A final family tree with the threads of cause from your own choices</li>
          </ul>
          <div className="actions" style={{ justifyContent: 'flex-start' }}>
            {BUY_URL ? (
              <a className="btn primary" href={BUY_URL} rel="noopener">Buy the full game{BUY_PRICE ? ` · ${BUY_PRICE}` : ''}</a>
            ) : WISHLIST_URL ? (
              <a className="btn primary" href={WISHLIST_URL} rel="noopener">Wish-list the full game</a>
            ) : (
              <span className="chip neu">The full game is not released yet</span>
            )}
          </div>
          <div className="actions" style={{ justifyContent: 'flex-start', margin: '6px 0' }}>
            <button className="btn" onClick={onSameSeed}><Icon name="dice" size={18} />Same seed, choose differently</button>
            <button className="btn" onClick={onNewRun}>New run</button>
            <button className="btn" onClick={save}><Icon name="download" size={18} />Save card (PNG)</button>
          </div>
          <p className="small" role="status">{msg}</p>
        </div>
      </div>
    </article>
  )
}

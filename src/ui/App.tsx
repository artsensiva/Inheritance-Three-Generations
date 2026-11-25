import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import { CompactHud, DeltaChips, Hud, ROMAN, useStageFocus } from './parts'
import { DemoEndStage, EndingStage, EventStage, HeirStage, IntroStage, LedgerStage, ResultStage } from './stages'
import { ANALYTICS_HOST, DEMO, DEMO_FAMILY } from '../config'
import { isDemoComplete } from './demo'
import { AMBITIONS, OBLS, PROPS, STARTS, TOWN } from '../content/catalog'
import { advance, choose, chooseHeir, newGame } from '../engine/engine'
import { DEMO_SAVE_KEY, SAVE_KEY, clearSave, readSave, writeSave, type StorageLike } from '../engine/save'
import type { GameState, HeirDir } from '../engine/types'

type Screen = 'title' | 'setup' | 'game'

function safeStorage(): StorageLike | null {
  try {
    const s = window.localStorage
    const k = '__probe__'
    s.setItem(k, '1')
    s.removeItem(k)
    return s
  } catch {
    return null
  }
}
const storage = safeStorage()
const KEY = DEMO ? DEMO_SAVE_KEY : SAVE_KEY
const SETTINGS_KEY = 'inheritance.settings.v1'

function loadSettings(): { reduceMotion: boolean } {
  try {
    const raw = storage?.getItem(SETTINGS_KEY)
    if (raw) return { reduceMotion: !!JSON.parse(raw).reduceMotion }
  } catch { /* ignore */ }
  return { reduceMotion: false }
}

function randomSeed(): number {
  try {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]
  } catch {
    return Math.floor(Math.random() * 4294967295)
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [game, setGame] = useState<GameState | null>(null)
  const [saved, setSaved] = useState<{ state: GameState; savedAt: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [introSeen, setIntroSeen] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [last, setLast] = useState<{ startId: string; ambitionId: string } | null>(null)

  useEffect(() => {
    if (!storage) { setNotice('This browser is blocking local storage, so progress cannot be saved. You can still play.'); return }
    const r = readSave(storage, KEY)
    if (r.ok) setSaved({ state: r.state, savedAt: r.savedAt })
    else if (r.reason === 'invalid') setNotice(r.message)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
    try { storage?.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])

  useEffect(() => {
    if (!game || !storage) return
    if (!writeSave(storage, game, Date.now(), KEY)) setNotice('Could not save progress (storage is full or unavailable).')
  }, [game])

  const start = useCallback((startId: string, ambitionId: string, seed?: number) => {
    const sid = DEMO ? DEMO_FAMILY : startId
    const g = newGame(seed ?? randomSeed(), sid, ambitionId)
    setGame(g); setIntroSeen(0); setScreen('game'); setLast({ startId: sid, ambitionId })
  }, [])

  const doChoose = useCallback((id: string) => {
    setGame((g) => { if (!g) return g; try { return choose(g, id) } catch (e) { setNotice((e as Error).message); return g } })
  }, [])
  const doAdvance = useCallback(() => setGame((g) => (g ? advance(g) : g)), [])
  const doHeir = useCallback((d: HeirDir) => setGame((g) => { if (!g) return g; setIntroSeen(0); return chooseHeir(g, d) }), [])

  const continueSaved = () => {
    if (!saved) return
    setGame(saved.state); setLast({ startId: saved.state.startId, ambitionId: saved.state.ambitionId })
    setIntroSeen(saved.state.turn > 0 || saved.state.phase !== 'choose' ? saved.state.gen : 0)
    setScreen('game')
  }
  const toTitle = () => {
    if (game && storage && game.phase === 'ended') { clearSave(storage, KEY); setSaved(null) }
    else if (game) setSaved({ state: game, savedAt: Date.now() })
    setScreen('title')
  }

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to the game</a>
      <header className="topbar">
        {screen !== 'title' && <h1 className="sr-only">Inheritance: Three Generations</h1>}
        <div className="brand"><span className="mark"><Icon name="tree" size={18} /></span>Inheritance <span className="small">· Three Generations{DEMO ? ' · Free demo' : ''}</span></div>
        {screen === 'game' && game && <>
          <nav className="gen-pips" aria-label="Generations">
            {[1, 2, 3].map((n) => <span key={n} className={`gen-pip ${n < game.gen || game.phase === 'ended' ? 'done' : ''}`} aria-current={n === game.gen && game.phase !== 'ended' ? 'step' : undefined}>Gen {ROMAN[n - 1]}</span>)}
          </nav>
          <button className="btn small" onClick={() => setShowHistory(true)}><Icon name="history" size={16} />History</button>
        </>}
        <button className="btn small ghost" onClick={() => setShowHow(true)}>How to play</button>
        <label className="small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontFamily: 'var(--sans)' }}>
          <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => setSettings({ reduceMotion: e.target.checked })} /> Reduce motion
        </label>
        {screen === 'game' && <button className="btn small ghost" onClick={toTitle}>Menu</button>}
      </header>

      {notice && <div className="notice" role="alert"><span>{notice}</span><button className="btn small" onClick={() => setNotice(null)}>Dismiss</button></div>}

      <main id="main">
        {screen === 'title' && <Title saved={saved} onNew={() => setScreen('setup')} onContinue={continueSaved} onHow={() => setShowHow(true)} />}
        {screen === 'setup' && <Setup onStart={start} onBack={() => setScreen('title')} preset={last} />}
        {screen === 'game' && game && (
          game.phase === 'ended' ? (
            <EndingStage g={game} onReplay={() => { setScreen('setup') }} onSameFamily={() => last && start(last.startId, last.ambitionId)} onTitle={toTitle} />
          ) : (
            <>
              <CompactHud g={game} />
              <div className="layout">
                <div key={`${game.gen}-${game.turn}-${game.phase}-${introSeen === game.gen}`}>
                  {DEMO && isDemoComplete(game) ? <DemoEndStage g={game} onSameSeed={() => start(game.startId, game.ambitionId, game.seed)} onNewRun={() => setScreen('setup')} />
                    : game.phase === 'choose' && game.turn === 0 && introSeen !== game.gen ? <IntroStage g={game} onBegin={() => setIntroSeen(game.gen)} />
                    : game.phase === 'choose' ? <EventStage g={game} onChoose={doChoose} />
                    : game.phase === 'result' ? <ResultStage g={game} onContinue={doAdvance} />
                    : game.phase === 'ledger' ? <LedgerStage g={game} onContinue={doAdvance} />
                    : <HeirStage g={game} onPick={doHeir} demo={DEMO} />}
                </div>
                <Hud g={game} />
              </div>
            </>
          )
        )}
      </main>
      {showHistory && game && <HistoryDialog g={game} onClose={() => setShowHistory(false)} />}
      {showHow && <HowTo onClose={() => setShowHow(false)} />}
    </div>
  )
}

function Title({ saved, onNew, onContinue, onHow }: { saved: { state: GameState; savedAt: number } | null; onNew: () => void; onContinue: () => void; onHow: () => void }) {
  const ref = useStageFocus<HTMLHeadingElement>()
  return (
    <section className="title-screen rise" aria-labelledby="t-title">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" style={{ margin: '0 auto', display: 'block' }}>
        <circle cx="60" cy="60" r="56" fill="#e8dbbd" stroke="#2a2118" strokeWidth="3" />
        <path d="M60 96V50M60 66L38 46M60 66l22-20M60 80L46 68M60 80l14-12" stroke="#2a2118" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="38" r="12" fill="#a63d2f" stroke="#2a2118" strokeWidth="3" />
        <circle cx="36" cy="44" r="8" fill="#2f6b66" stroke="#2a2118" strokeWidth="3" />
        <circle cx="84" cy="44" r="8" fill="#b5791d" stroke="#2a2118" strokeWidth="3" />
      </svg>
      <div className="eyebrow" style={{ marginTop: 14 }}>{TOWN} · a family archive</div>
      <h1 id="t-title" ref={ref} tabIndex={-1}>Inheritance: Three Generations</h1>
      <p className="promise">Make a life for yourself. Discover what your children inherit from your choices.</p>
      <p>Guide one family through three generations of a fictional canal town. Every decision about work, land, debt, learning and loyalty reaches forward to the people who come after you.</p>
      {DEMO && <p className="demo-note"><b>Free demo.</b> Play the first generation of the Marlow Cooperage family, then decide what the next generation inherits. The full game continues through three generations with three families.</p>}
      <div className="actions">
        {saved && <button className="btn primary" onClick={onContinue}>Continue — {STARTS[saved.state.startId].family} family, generation {ROMAN[saved.state.gen - 1]}</button>}
        <button className={`btn ${saved ? '' : 'primary'}`} onClick={onNew}>New run</button>
        <button className="btn ghost" onClick={onHow}>How to play</button>
      </div>
      <p className="legal">A fictional town in a fictional era. This is a strategy game, not a model of real lives or real statistics. {DEMO ? 'The demo takes roughly 6–8 minutes.' : 'Runs take about 15–25 minutes.'} Progress is saved in this browser only.{ANALYTICS_HOST ? ` Visits to this site are counted with an analytics service (${ANALYTICS_HOST}) unless your browser sends Do Not Track or Global Privacy Control.` : ''}</p>
    </section>
  )
}

function Setup({ onStart, onBack, preset }: { onStart: (s: string, a: string, seed?: number) => void; onBack: () => void; preset: { startId: string; ambitionId: string } | null }) {
  const ref = useStageFocus<HTMLHeadingElement>()
  const [startId, setStart] = useState(DEMO ? DEMO_FAMILY : preset?.startId ?? 'cooperage')
  const [amb, setAmb] = useState(preset?.ambitionId ?? 'roots')
  const [seed, setSeed] = useState('')
  const seedNum = /^\d+$/.test(seed.trim()) ? Number(seed.trim()) : undefined
  return (
    <section className="rise" aria-labelledby="s-title">
      <div className="eyebrow">New run</div>
      <h2 id="s-title" ref={ref} tabIndex={-1}>Choose a family and an ambition</h2>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="panel-title">Starting situation</legend>
        <div className="pick">
          {Object.values(STARTS).map((s) => (
            <label key={s.id} className={DEMO && s.id !== DEMO_FAMILY ? 'locked' : undefined}>
              <input type="radio" name="start" value={s.id} checked={startId === s.id} disabled={DEMO && s.id !== DEMO_FAMILY} onChange={() => setStart(s.id)} />
              <span className="opt">
                {DEMO && s.id !== DEMO_FAMILY && <span className="lock-tag"><Icon name="lock" size={13} /> Full game</span>}
                <b>{s.title}</b>
                <span style={{ display: 'block' }}>{s.blurb}</span>
                <ul className="tagrow">
                  <li className="tag"><Icon name="coin" size={13} />{s.money} coin</li>
                  <li className="tag"><Icon name="bonds" size={13} />{s.bonds} bonds</li>
                  {s.debt > 0 && <li className="tag duty"><Icon name="debt" size={13} />debt {s.debt}</li>}
                  {s.props.map((p) => <li key={p} className="tag prop"><Icon name={PROPS[p].icon} size={13} />{PROPS[p].name}</li>)}
                  {s.obl.map((o) => <li key={o} className="tag duty">{OBLS[o].name}</li>)}
                </ul>
                <span className="small" style={{ display: 'block', marginTop: 6 }}>{s.difficultyNote}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="panel-title">Family ambition {DEMO ? '(shapes your strategy; scored in the full game)' : '(judged at the end)'}</legend>
        <div className="pick">
          {Object.values(AMBITIONS).map((a) => (
            <label key={a.id}>
              <input type="radio" name="amb" value={a.id} checked={amb === a.id} onChange={() => setAmb(a.id)} />
              <span className="opt"><b>{a.title}</b><span style={{ display: 'block', fontStyle: 'italic' }}>{a.tagline}</span><span className="small" style={{ display: 'block' }}>{a.rule}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <details>
        <summary>Advanced: replay a specific seed</summary>
        <div className="field">
          <label>Seed (digits only; leave blank for a random run) <input type="text" inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value)} aria-describedby="seed-help" /></label>
          <div id="seed-help" className="small">The same seed, family and choices produce the same run.</div>
        </div>
      </details>
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn primary" onClick={() => onStart(startId, amb, seedNum)}>Begin the story <Icon name="arrow" size={18} /></button>
        <button className="btn ghost" onClick={onBack}>Back</button>
      </div>
    </section>
  )
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const prev = useRef<Element | null>(null)
  useEffect(() => {
    prev.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const nodes = document.querySelectorAll<HTMLElement>('.dialog button, .dialog a[href], .dialog summary')
        if (!nodes.length) return
        const first = nodes[0], lastN = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastN.focus() }
        else if (!e.shiftKey && document.activeElement === lastN) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); (prev.current as HTMLElement | null)?.focus?.() }
  }, [onClose])
  return (
    <div className="dialog-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dlg-head"><h2 style={{ margin: 0 }}>{title}</h2><button ref={closeRef} className="btn small" onClick={onClose}><Icon name="close" size={16} />Close</button></div>
        {children}
      </div>
    </div>
  )
}

function HistoryDialog({ g, onClose }: { g: GameState; onClose: () => void }) {
  return (
    <Dialog title="Family history" onClose={onClose}>
      {g.history.length === 0 && <p>Nothing has happened yet.</p>}
      {g.history.map((e) => (
        <div className="histentry" key={e.id}>
          <div className="small">Generation {ROMAN[e.gen - 1]} · decision {e.ev === '_heir' ? 'at the end' : e.turn + 1}</div>
          <h3>{e.evTitle}: “{e.optLabel}”</h3>
          <p className="res">{e.result}</p>
          {e.causes.length > 0 && <p className="small"><Icon name="thread" size={13} /> Because of: {e.causes.map((c) => `“${g.history[c].optLabel}” (gen ${g.history[c].gen})`).join(', ')}</p>}
          <DeltaChips d={e.d} extra={<>{e.gained.map((p) => <li key={p} className="chip pos">Gained {PROPS[p].name}</li>)}{e.lost.map((p) => <li key={p} className="chip neg">Lost {PROPS[p].name}</li>)}</>} />
        </div>
      ))}
    </Dialog>
  )
}

function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="How to play" onClose={onClose}>
      <p>You guide one family through three generations. Each generation has 7 decisions. Pick one of the options on each card; you will see the immediate effects, and some choices come back later.</p>
      <h3>Four resources</h3>
      <ul className="notes">
        <li><b>Health</b> and <b>knowledge</b> belong to the current character. They do not pass to the next generation as numbers.</li>
        <li><b>Coin</b> and <b>family bonds</b> belong to the household. Coin is limited to 12; surplus is spent on the household.</li>
      </ul>
      <h3>The ledger</h3>
      <p>Twice per generation the household ledger runs: property earns, duties and debt interest cost, and busy lives pull the family apart a little. A shortfall is quietly borrowed, which becomes debt.</p>
      <h3>What the next generation inherits</h3>
      <p>At the end of each generation you decide how the estate passes on. <b>Property, debt, duties and standing consequences are inherited.</b> The heir’s starting health and knowledge are rebuilt from how they were raised, which is explained on screen. Skills pass down one level lower if the parent had them at level 2 or more.</p>
      <h3>Ambitions and endings</h3>
      <p>Pick a family ambition at the start. At the end you get a family tree, an ending that depends on how the family finished, and the actual threads of cause from your own choices. You can save the legacy card as an image.</p>
      <p className="small">Keyboard: press 1–3 to choose, Tab to move, Enter to confirm. A fictional town in a fictional era — not a model of real lives.</p>
    </Dialog>
  )
}

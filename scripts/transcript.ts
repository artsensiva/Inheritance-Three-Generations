import { advance, choose, chooseHeir, newGame, currentEvent } from '../src/engine/engine'
import { pickHeir, pickOption } from '../src/engine/bots'
import { getEnding } from '../src/engine/endings'
import type { PolicyName } from '../src/engine/bots'
const [seed = '5', start = 'tenant', amb = 'town_name', pol = 'ambition'] = process.argv.slice(2)
let s = newGame(Number(seed), start, amb)
const ctx = { rngState: Number(seed) + 1 }
const st = () => `m${s.money} b${s.bonds} d${s.debt} | h${s.char.health} k${s.char.knowledge} | ${s.props.join(',') || '-'} | ${s.obl.join(',') || '-'}`
console.log(`START ${start}/${amb} seed ${seed}: ${st()}`)
while (s.phase !== 'ended') {
  if (s.phase === 'choose') {
    const ev = currentEvent(s)!
    console.log(`\n[G${s.gen}.${s.turn + 1}] ${ev.title}${s.current!.causeLines.length ? '   <<' + s.current!.causeLines.join(' / ') + '>>' : ''}`)
    console.log('  ' + s.current!.text + (s.current!.extras.length ? '\n  + ' + s.current!.extras.join('\n  + ') : ''))
    const id = pickOption(s, pol as PolicyName, ctx)
    const o = ev.options.find((x) => x.id === id)!
    s = choose(s, id)
    const e = s.history[s.lastEntry!]
    console.log(`  -> ${o.label}${e.failed ? ' (RISK FAILED)' : ''}: ${e.result}`)
    console.log(`     ${st()}`)
  } else if (s.phase === 'result' || s.phase === 'ledger') {
    if (s.phase === 'ledger') console.log('  [ledger] ' + s.ledger!.lines.map((l) => `${l.label} ${l.m || ''}${l.b ? ' b' + l.b : ''}`).join('; '))
    s = advance(s)
  } else if (s.phase === 'heir') {
    const d = pickHeir(s, pol as PolicyName, ctx)
    console.log(`\n=== HEIR: ${d}`)
    s = chooseHeir(s, d)
    console.log('  ' + s.char.name + ': ' + s.char.notes.join(' | '))
  }
}
const e = getEnding(s)
console.log(`\nENDING: ${e.title} — ambition ${e.ambition.met ? 'MET' : 'missed'}`)
e.threads.forEach((t) => console.log('  THREAD: ' + t.sentences.join(' ')))
e.facts.forEach((f) => console.log('  FACT: ' + f))

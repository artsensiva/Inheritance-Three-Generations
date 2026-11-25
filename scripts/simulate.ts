import { playRun, type PolicyName } from '../src/engine/bots'
import { getEnding } from '../src/engine/endings'
import { EVENT_LIST } from '../src/content/events'
import { STARTS, AMBITIONS } from '../src/content/catalog'
import { validateContent } from '../src/content/validate'

const N = Number(process.argv[2] ?? 300)
const errs = validateContent()
if (errs.length) { console.log('CONTENT ERRORS:\n' + errs.join('\n')); process.exitCode = 1 }

const policies: PolicyName[] = ['random', 'first', 'money', 'knowledge', 'bonds', 'health', 'ambition']
const starts = Object.keys(STARTS)
const ambitions = Object.keys(AMBITIONS)
const seen: Record<string, number> = {}
const endings: Record<string, number> = {}
let total = 0
let maxSteps = 0
let deaths = 0
console.log(`\n== Ambition success rate by policy (n=${N} per start×ambition) ==`)
const table: Record<string, Record<string, string>> = {}
for (const pol of policies) {
  table[pol] = {}
  for (const am of ambitions) {
    let met = 0, n = 0
    const perStart: string[] = []
    for (const st of starts) {
      let m2 = 0
      for (let i = 0; i < N; i++) {
        const r = playRun(i * 7919 + 13, st, am, pol)
        total++
        maxSteps = Math.max(maxSteps, r.steps)
        if (r.ambitionMet) { met++; m2++ }
        n++
        for (const e of r.events) seen[e] = (seen[e] ?? 0) + 1
        const en = getEnding(r.state)
        endings[en.profileId] = (endings[en.profileId] ?? 0) + 1
        if (r.state.past.some((c) => c.died) || r.state.char.died) deaths++
      }
      perStart.push(`${st}:${Math.round((100 * m2) / N)}%`)
    }
    table[pol][am] = `${Math.round((100 * met) / n)}% (${perStart.join(' ')})`
  }
}
console.table(table)
console.log(`runs=${total} maxSteps=${maxSteps} runsWithDeath=${deaths}`)
console.log('\n== Ending profile frequency ==')
console.table(Object.fromEntries(Object.entries(endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, `${((100 * v) / total).toFixed(1)}%`])))
const unreached = EVENT_LIST.filter((e) => !seen[e.id]).map((e) => e.id)
console.log('\nEvents never seen:', unreached.length ? unreached.join(', ') : 'none')
const freq = EVENT_LIST.map((e) => [e.id, seen[e.id] ?? 0] as const).sort((a, b) => b[1] - a[1])
console.log('Most frequent:', freq.slice(0, 6).map(([k, v]) => `${k}=${v}`).join(', '))
console.log('Least frequent:', freq.filter(([, v]) => v > 0).slice(-8).map(([k, v]) => `${k}=${v}`).join(', '))

// ---- scheduled-chain follow-through: how often does a scheduled consequence actually arrive? ----
import { EVENTS } from '../src/content/events'
{
  const sched: Record<string, { scheduled: number; fired: number }> = {}
  for (const st of starts) for (let i = 0; i < Math.min(N, 80); i++) for (const pol of ['random', 'ambition'] as PolicyName[]) {
    const r = playRun(i * 31 + 7, st, ambitions[i % ambitions.length], pol)
    for (const e of r.state.history) {
      if (e.ev === '_heir') continue
      const ev = EVENTS[e.ev]
      const o = ev.options.find((x) => x.id === e.opt)!
      const fx = e.failed && o.risk ? o.risk.fail : o.fx
      for (const sc of fx.sched ?? []) {
        const k = sc.ev
        sched[k] ??= { scheduled: 0, fired: 0 }
        sched[k].scheduled++
        if (r.state.history.some((h) => h.ev === sc.ev && h.causes.includes(e.id))) sched[k].fired++
      }
    }
  }
  console.log('\n== Scheduled consequences: arrival rate ==')
  console.table(Object.fromEntries(Object.entries(sched).map(([k, v]) => [k, { ...v, rate: `${Math.round((100 * v.fired) / v.scheduled)}%` }])))
}

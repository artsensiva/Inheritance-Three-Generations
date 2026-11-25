import { EVENT_LIST } from '../src/content/events'
import type { Fx, OptionDef } from '../src/engine/types'
const vec = (fx: Fx) => ({ m: fx.m ?? 0, h: fx.h ?? 0, k: fx.k ?? 0, b: fx.b ?? 0, d: -(fx.debt ?? 0) })
const special = (o: OptionDef) => !!(o.fx.flags?.length || o.fx.gain?.length || o.fx.skill && Object.keys(o.fx.skill).length || o.fx.obl?.length || o.fx.sched?.length || o.fx.free?.length || o.risk || o.req)
let n = 0
for (const ev of EVENT_LIST) {
  for (const x of ev.options) for (const y of ev.options) {
    if (x === y) continue
    const a = vec(x.fx), b = vec(y.fx)
    const ge = (Object.keys(a) as (keyof typeof a)[]).every((k) => b[k] >= a[k])
    const gt = (Object.keys(a) as (keyof typeof a)[]).some((k) => b[k] > a[k])
    if (ge && gt && !special(x) && !(y.fx.obl?.length) && !y.req && !y.risk) { console.log(`${ev.id}: "${x.label}" is dominated by "${y.label}"`); n++ }
  }
}
console.log('dominated options:', n)

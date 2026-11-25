import { EVENT_LIST, EVENTS } from './events'
import { OBLS, PROPS, SKILLS, STARTS } from './catalog'
import type { Fx, Req } from '../engine/types'

/** Structural checks on the content data. Returns a list of human-readable problems. */
export function validateContent(): string[] {
  const errs: string[] = []
  const ids = new Set<string>()
  const checkFx = (where: string, fx: Fx) => {
    for (const p of [...(fx.gain ?? []), ...(fx.lose ?? [])]) if (!PROPS[p]) errs.push(`${where}: unknown property ${p}`)
    for (const o of [...(fx.obl ?? []), ...(fx.free ?? [])]) if (!OBLS[o]) errs.push(`${where}: unknown obligation ${o}`)
    for (const k of Object.keys(fx.skill ?? {})) if (!SKILLS[k]) errs.push(`${where}: unknown skill ${k}`)
    for (const sc of fx.sched ?? []) if (!EVENTS[sc.ev]) errs.push(`${where}: schedules unknown event ${sc.ev}`)
  }
  const checkReq = (where: string, r?: Req) => {
    if (!r) return
    for (const p of [...(r.prop ?? []), ...(r.noProp ?? []), ...(r.anyProp ?? [])]) if (!PROPS[p]) errs.push(`${where}: unknown property ${p}`)
    for (const o of [...(r.obl ?? []), ...(r.noObl ?? [])]) if (!OBLS[o]) errs.push(`${where}: unknown obligation ${o}`)
    for (const k of Object.keys(r.skill ?? {})) if (!SKILLS[k]) errs.push(`${where}: unknown skill ${k}`)
  }
  for (const ev of EVENT_LIST) {
    if (ids.has(ev.id)) errs.push(`duplicate event id ${ev.id}`)
    ids.add(ev.id)
    if (ev.options.length < 2 || ev.options.length > 3) errs.push(`${ev.id}: needs 2–3 options`)
    const oids = new Set<string>()
    checkReq(ev.id, ev.when)
    for (const cb of ev.callbacks ?? []) checkReq(`${ev.id} callback`, cb.if)
    for (const o of ev.options) {
      if (oids.has(o.id)) errs.push(`${ev.id}: duplicate option ${o.id}`)
      oids.add(o.id)
      checkFx(`${ev.id}.${o.id}`, o.fx)
      checkReq(`${ev.id}.${o.id}`, o.req)
      if (o.risk) checkFx(`${ev.id}.${o.id}.fail`, o.risk.fail)
      if (!o.label || !o.result) errs.push(`${ev.id}.${o.id}: missing label/result`)
    }
    // soft-lock guard: at least one option that is always selectable
    const safe = ev.options.some((o) => !o.req && (o.fx.m ?? 0) >= 0 && (o.fx.h ?? 0) >= 0 && !(o.fx.lose?.length))
    const youthOnlyLater = ev.phase.every((p) => p === 'youth') && ev.gens.every((g) => g >= 2)
    if (!safe && !youthOnlyLater) errs.push(`${ev.id}: no always-available option (soft-lock risk)`)
    if (!ev.chainOnly && ev.gens.length === 0) errs.push(`${ev.id}: no generations`)
  }
  for (const st of Object.values(STARTS)) {
    if (!EVENTS[st.opener]) errs.push(`start ${st.id}: unknown opener ${st.opener}`)
    for (const p of st.props) if (!PROPS[p]) errs.push(`start ${st.id}: unknown property ${p}`)
    for (const o of st.obl) if (!OBLS[o]) errs.push(`start ${st.id}: unknown obligation ${o}`)
  }
  return errs
}

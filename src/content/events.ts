import type { EventDef } from '../engine/types'
import { EVENTS_A } from './events_a'
import { EVENTS_B } from './events_b'
import { EVENTS_C } from './events_c'

export const EVENT_LIST: EventDef[] = [...EVENTS_A, ...EVENTS_B, ...EVENTS_C]
export const EVENTS: Record<string, EventDef> = Object.fromEntries(EVENT_LIST.map((e) => [e.id, e]))

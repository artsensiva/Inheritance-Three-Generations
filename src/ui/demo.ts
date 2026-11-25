import { getEnding } from '../engine/endings'
import type { Ending, GameState } from '../engine/types'
import { STARTS } from '../content/catalog'

/** The demo covers generation I and the heir decision; it ends when generation II begins. */
export function isDemoComplete(g: GameState): boolean {
  return g.gen >= 2
}

/** A partial "story so far" ending: only the generations that actually finished. */
export function demoCardEnding(g: GameState): Ending {
  const e = getEnding(g)
  const done = g.past.length
  const family = STARTS[g.startId].family
  return {
    ...e,
    title: 'The story so far',
    blurb: `Generation I of the ${family} line has made its choices. What they leave behind will shape what comes next.`,
    generations: e.generations.slice(0, done),
    threads: [],
    facts: [],
  }
}

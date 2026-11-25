/**
 * Builds the deployable static site into ./site :
 *   site/index.html, landing.css, sample-card.svg   — the landing page
 *   site/play/                                      — the free demo build
 * Optional: VITE_WISHLIST_URL=https://… adds a wish-list button (landing page and demo end screen).
 * Nothing is uploaded or published by this script.
 */
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { playRun } from '../src/engine/bots'
import { getEnding } from '../src/engine/endings'
import { legacySvg } from '../src/ui/legacy'
import { STARTS } from '../src/content/catalog'

const out = 'site'
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

console.log('Building the demo into site/play …')
execSync(`npx vite build --mode demo --outDir ${out}/play --emptyOutDir`, { stdio: 'inherit' })

// Example legacy card: first deterministic run that illustrates the game well and fulfils its ambition (real engine output).
let svg = ''
search: for (let seed = 1000; seed < 1600; seed++) {
  for (const amb of ['roots', 'open_book', 'close_table', 'town_name']) {
    const r = playRun(seed, 'cooperage', amb, 'ambition')
    const e = getEnding(r.state)
    if (!r.state.char.died && e.ambition.met && e.threads.length >= 2 && e.threads[0].generations >= 2 && e.generations.every((g) => g.keyChoices.length >= 2)) {
      svg = legacySvg(STARTS.cooperage.family, e)
      console.log(`Sample card from seed ${seed} (${amb}): “${e.title}”`)
      break search
    }
  }
}
if (!svg) throw new Error('No suitable sample run found')
writeFileSync(`${out}/sample-card.svg`, svg)

const url = (process.env.VITE_WISHLIST_URL ?? '').trim()
const button = url
  ? `<a class="btn" href="${url.replace(/"/g, '&quot;')}" rel="noopener">Wish-list the full game</a>`
  : '<span class="note" style="align-self:center">The full game is not released yet.</span>'
const html = readFileSync('landing/index.html', 'utf8').replace('{{WISHLIST_BUTTON}}', button)
writeFileSync(`${out}/index.html`, html)
cpSync('landing/landing.css', `${out}/landing.css`)
console.log('Site ready in ./site')

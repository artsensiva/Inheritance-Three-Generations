/**
 * Builds the deployable static site into ./site :
 *   site/index.html, landing.css, sample-card.svg   — the landing page
 *   site/play/                                      — the free demo build
 * Optional: VITE_WISHLIST_URL=https://… adds a wish-list button (landing page and demo end screen).
 * Optional: ANALYTICS_SCRIPT_SRC (+ ANALYTICS_ATTRS) adds privacy-conscious visit analytics; see docs/ANALYTICS.md.
 * Optional: LEGAL_DETAILS alone adds Impressum and privacy pages (needed for a commercial site in Germany); SITE_URL adds canonical links and sitemap.xml.
 * Every build adds a Content-Security-Policy meta tag and a 404 page.
 * Optional: PAYMENT_LINK_URL (+ PRICE_LABEL, DOWNLOAD_URL, LEGAL_DETAILS) adds a Stripe Payment Link buy flow, /thanks/ and legal pages; see docs/PAYMENTS.md.
 * Nothing is uploaded or published by this script.
 */
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { playRun } from '../src/engine/bots'
import { getEnding } from '../src/engine/endings'
import { legacySvg } from '../src/ui/legacy'
import { STARTS } from '../src/content/catalog'
import { analyticsLoader, injectLoader, parseAnalyticsConfig, privacyParagraph } from './analytics'
import { buyButton, buyNote, findPlaceholders, footerLinks, legalPages, parseLegalConfig, parseShopConfig, renderPage } from './shop'
import { hardenHead, notFoundPage, parseSiteUrl, sitemap } from './headers'

const out = 'site'
const analytics = parseAnalyticsConfig(process.env)
const shop = parseShopConfig(process.env)
const legalCfg = shop ? { legal: shop.legal, allowPlaceholders: shop.allowPlaceholders } : parseLegalConfig(process.env)
const site = parseSiteUrl(process.env)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

console.log('Building the demo into site/play …')
execSync(`npx vite build --mode demo --outDir ${out}/play --emptyOutDir`, {
  stdio: 'inherit',
  env: { ...process.env, VITE_ANALYTICS_HOST: analytics?.host ?? '', VITE_BUY_URL: shop?.paymentUrl ?? '', VITE_BUY_PRICE: shop?.price ?? '' },
})

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
const button = shop
  ? buyButton(shop)
  : url
  ? `<a class="btn" href="${url.replace(/"/g, '&quot;')}" rel="noopener">Wish-list the full game</a>`
  : '<span class="note self-center">The full game is not released yet.</span>'
let html = readFileSync('landing/index.html', 'utf8').replace('{{WISHLIST_BUTTON}}', button)
  .replace('{{BUY_NOTE}}', shop ? buyNote(shop) : '')
  .replace('{{FOOTER_LINKS}}', legalCfg ? ` ${footerLinks('./', !!shop)}` : '')
  .replace('{{PRIVACY_TEXT}}', privacyParagraph(analytics, !!shop, !!legalCfg))
const playPath = `${out}/play/index.html`
let playHtml = readFileSync(playPath, 'utf8')
if (analytics) {
  writeFileSync(`${out}/analytics.js`, analyticsLoader(analytics))
  html = injectLoader(html, './analytics.js')
  playHtml = injectLoader(playHtml, '../analytics.js')
  console.log(`Analytics enabled (${analytics.host}); skipped for Do Not Track / Global Privacy Control.`)
} else {
  console.log('Analytics: none (ANALYTICS_SCRIPT_SRC not set).')
}

const canon = (dir: string) => (site ? new URL(dir ? `${dir}/` : '', site).toString() : null)
const pages: Record<string, string> = {}
if (legalCfg) {
  const shell = readFileSync('landing/page.html', 'utf8')
  const links = footerLinks('../', !!shop)
  for (const page of legalPages(legalCfg.legal, { analyticsHost: analytics?.host ?? null, shop })) {
    let h = renderPage(shell, page, links)
    if (analytics) h = injectLoader(h, '../analytics.js')
    pages[page.dir] = hardenHead(h, { kind: 'page', analytics, canonical: page.robots === 'noindex' ? null : canon(page.dir) })
  }
  // Fail closed: never publish legal pages, or a checkout button, with unfinished text.
  const open = findPlaceholders([html, ...Object.values(pages)].join('\n'))
  if (open.length && !legalCfg.allowPlaceholders) {
    throw new Error(`Legal pages are enabled but details are incomplete. Fill these in (LEGAL_DETAILS, DOWNLOAD_URL):\n  ${open.join('\n  ')}\nSet ALLOW_PLACEHOLDER_LEGAL=1 only for a local preview.`)
  }
  for (const [dir, h] of Object.entries(pages)) {
    mkdirSync(`${out}/${dir}`, { recursive: true })
    writeFileSync(`${out}/${dir}/index.html`, h)
  }
  console.log(`Legal pages: ${Object.keys(pages).join(', ')}${open.length ? `; ${open.length} placeholder(s) still open (preview only)` : ''}`)
} else {
  console.log('Legal pages: none (LEGAL_DETAILS not set). A commercial site in Germany needs an Impressum and privacy information.')
}
console.log(shop ? `Payment flow enabled (Stripe Payment Link, ${shop.price}).` : 'Payment flow: none (PAYMENT_LINK_URL not set).')

writeFileSync(`${out}/index.html`, hardenHead(html, { kind: 'page', analytics, canonical: canon('') }))
writeFileSync(playPath, hardenHead(playHtml, { kind: 'app', analytics, canonical: canon('play') }))
writeFileSync(`${out}/404.html`, notFoundPage(site, analytics))
if (site) {
  writeFileSync(`${out}/sitemap.xml`, sitemap(site, ['play', ...Object.keys(pages).filter((d) => d !== 'thanks')]))
  console.log(`Canonical links and sitemap.xml for ${site.toString()}`)
}
cpSync('landing/landing.css', `${out}/landing.css`)
console.log('Site ready in ./site')

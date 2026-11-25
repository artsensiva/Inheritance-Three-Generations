import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// All real site builds live in one file so they run one after another: every build clears and rewrites ./site.
const CFG = { ANALYTICS_SCRIPT_SRC: 'https://stats.example.org/script.js', ANALYTICS_ATTRS: '{"data-website-id":"abc-123"}' }
const SHOP = { PAYMENT_LINK_URL: 'https://buy.stripe.com/test_abc123', PRICE_LABEL: '€9.99' }
const LEGAL = JSON.stringify({ name: 'Erika Mustermann', street: 'Musterstr. 1', postalCity: '10115 Berlin', email: 'hello@example.org', smallBusiness: true, disputeResolution: 'unwilling', deliveryHost: 'itch.io' })
const BLANK = { ANALYTICS_SCRIPT_SRC: '', ANALYTICS_ATTRS: '', PAYMENT_LINK_URL: '', PRICE_LABEL: '', DOWNLOAD_URL: '', LEGAL_DETAILS: '', ALLOW_PLACEHOLDER_LEGAL: '' }
const run = (env: Record<string, string>) =>
  execSync('npx tsx scripts/build-site.ts', { env: { ...process.env, ...BLANK, ...env }, stdio: 'pipe', timeout: 120000 }).toString()
const read = (p: string) => readFileSync(p, 'utf8')

describe('site build: analytics', () => {
  it('adds analytics only when configured', { timeout: 250000 }, () => {
    const on = run(CFG)
    expect(on).toMatch(/Analytics enabled \(stats\.example\.org\)/)
    expect(existsSync('site/analytics.js')).toBe(true)
    expect(read('site/index.html')).toContain('src="./analytics.js"')
    expect(read('site/play/index.html')).toContain('src="../analytics.js"')
    expect(read('site/index.html')).not.toContain('{{')
    expect(read('site/index.html')).not.toContain('stats.example.org/script.js')
    const off = run({})
    expect(off).toMatch(/Analytics: none/)
    expect(existsSync('site/analytics.js')).toBe(false)
    expect(read('site/index.html')).not.toContain('analytics.js')
    expect(read('site/index.html')).toContain('no tracking')
    expect(read('site/play/index.html')).not.toContain('analytics.js')
  })
})

describe('site build: payment flow', () => {
  it('changes nothing when no payment link is set', { timeout: 250000 }, () => {
    const out = run({})
    expect(out).toMatch(/Payment flow: none/)
    for (const d of ['impressum', 'privacy', 'withdrawal', 'thanks']) expect(existsSync(`site/${d}`)).toBe(false)
    const idx = read('site/index.html')
    expect(idx).not.toContain('stripe')
    expect(idx).not.toContain('Impressum')
    expect(idx).not.toContain('{{')
    const jsOff = readdirSync('site/play/assets').filter((f) => f.endsWith('.js')).map((f) => read(`site/play/assets/${f}`)).join('')
    expect(jsOff).not.toContain('buy.stripe.com')
  })
  it('refuses to publish a buy button next to unfinished legal text', { timeout: 250000 }, () => {
    let msg = ''
    try {
      run(SHOP)
    } catch (e) {
      msg = String((e as { stderr?: Buffer }).stderr ?? e)
    }
    expect(msg).toMatch(/legal details are incomplete/)
    expect(msg).toMatch(/YOUR FULL NAME/)
  })
  it('builds a draft preview on request, with every placeholder visible', { timeout: 250000 }, () => {
    run({ ...SHOP, ALLOW_PLACEHOLDER_LEGAL: '1' })
    const imp = read('site/impressum/index.html')
    expect(imp).toContain('Draft template')
    expect(imp).toContain('<mark class="ph">')
    expect(read('site/thanks/index.html')).toContain('noindex')
  })
  it('builds the full flow once the details are complete', { timeout: 250000 }, () => {
    const out = run({ ...SHOP, LEGAL_DETAILS: LEGAL, DOWNLOAD_URL: 'https://files.example.org/inheritance.zip', ...CFG })
    expect(out).toMatch(/Payment flow enabled/)
    const idx = read('site/index.html')
    expect(idx).toContain('href="https://buy.stripe.com/test_abc123"')
    expect(idx).toContain('Buy the full game · €9.99')
    expect(idx).toContain('./withdrawal/')
    expect(idx).toContain('./impressum/')
    expect(idx).toContain('Stripe')
    expect(idx).not.toMatch(/\[\[|\{\{/)
    for (const d of ['impressum', 'privacy', 'withdrawal', 'thanks']) {
      const h = read(`site/${d}/index.html`)
      expect(h).not.toMatch(/\[\[|\{\{/)
      expect(h).not.toContain('Draft template')
      expect(h).toContain('href="../landing.css"')
      expect(h).toContain('src="../analytics.js"')
    }
    expect(read('site/thanks/index.html')).toContain('https://files.example.org/inheritance.zip')
    const js = readdirSync('site/play/assets').filter((f) => f.endsWith('.js')).map((f) => read(`site/play/assets/${f}`)).join('')
    expect(js).toContain('https://buy.stripe.com/test_abc123')
    expect(read('site/privacy/index.html')).toContain('stats.example.org')
  })
})

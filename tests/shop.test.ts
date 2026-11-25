import { describe, expect, it } from 'vitest'
import { buyButton, buyNote, escapeHtml, findPlaceholders, parseShopConfig, renderPage, shopPages, vatNote } from '../scripts/shop'
import { privacyParagraph } from '../scripts/analytics'

const LINK = { PAYMENT_LINK_URL: 'https://buy.stripe.com/test_abc123', PRICE_LABEL: '€9.99' }
const FULL_LEGAL = JSON.stringify({ name: 'Erika Mustermann', street: 'Musterstr. 1', postalCity: '10115 Berlin', email: 'hello@example.org', smallBusiness: true })
const SHELL = '<title>{{TITLE}}</title><meta name="description" content="{{DESCRIPTION}}"><meta name="robots" content="{{ROBOTS}}"><main>{{BODY}}</main>{{FOOTER_LINKS}}'

describe('shop config', () => {
  it('is off unless a payment link is set', () => {
    expect(parseShopConfig({})).toBeNull()
    expect(parseShopConfig({ PAYMENT_LINK_URL: '  ', PRICE_LABEL: '€9' })).toBeNull()
  })
  it('accepts a Stripe Payment Link with a price', () => {
    const c = parseShopConfig(LINK)!
    expect(c.paymentUrl).toBe('https://buy.stripe.com/test_abc123')
    expect(c.price).toBe('€9.99')
    expect(c.downloadUrl).toBeNull()
    expect(c.legal.name).toMatch(/^\[\[/)
    expect(c.allowPlaceholders).toBe(false)
  })
  it('rejects links that are not https Stripe Payment Links, or a missing price', () => {
    expect(() => parseShopConfig({ ...LINK, PAYMENT_LINK_URL: 'http://buy.stripe.com/x' })).toThrow(/https/)
    expect(() => parseShopConfig({ ...LINK, PAYMENT_LINK_URL: 'https://evil.example/x' })).toThrow(/Stripe/)
    expect(() => parseShopConfig({ ...LINK, PAYMENT_LINK_URL: 'https://buy.stripe.com.evil.example/x' })).toThrow(/Stripe/)
    expect(() => parseShopConfig({ ...LINK, PAYMENT_LINK_URL: 'javascript:alert(1)' })).toThrow()
    expect(() => parseShopConfig({ ...LINK, PAYMENT_LINK_URL: 'https://user:pw@buy.stripe.com/x' })).toThrow(/credentials/)
    expect(() => parseShopConfig({ PAYMENT_LINK_URL: LINK.PAYMENT_LINK_URL })).toThrow(/PRICE_LABEL/)
    expect(() => parseShopConfig({ ...LINK, PRICE_LABEL: 'free' })).toThrow(/number/)
    expect(() => parseShopConfig({ ...LINK, DOWNLOAD_URL: 'http://files.example/x.zip' })).toThrow(/https/)
  })
  it('validates legal details strictly', () => {
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '{nope' })).toThrow(/JSON/)
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '[]' })).toThrow(/object/)
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '{"nmae":"x"}' })).toThrow(/unknown field/)
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '{"name":""}' })).toThrow(/non-empty/)
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '{"smallBusiness":"yes"}' })).toThrow(/true or false/)
    expect(() => parseShopConfig({ ...LINK, LEGAL_DETAILS: '{"disputeResolution":"maybe"}' })).toThrow(/willing/)
    const c = parseShopConfig({ ...LINK, LEGAL_DETAILS: FULL_LEGAL })!
    expect(c.legal.name).toBe('Erika Mustermann')
    expect(c.legal.smallBusiness).toBe(true)
  })
})

describe('rendering', () => {
  it('escapes every injected value and highlights placeholders', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
    const c = parseShopConfig({ ...LINK, PRICE_LABEL: '€9<b>', LEGAL_DETAILS: JSON.stringify({ name: '<script>x</script>' }) })!
    expect(buyButton(c)).not.toContain('<b>')
    const pages = shopPages(c, { analyticsHost: null }).map((p) => p.body).join('')
    expect(pages).not.toContain('<script>')
    expect(pages).toContain('&lt;script&gt;')
    expect(pages).toContain('<mark class="ph">[[')
  })
  it('states the VAT position only from the configured tax status', () => {
    const base = parseShopConfig(LINK)!.legal
    expect(vatNote({ ...base, smallBusiness: true })).toMatch(/§ 19 UStG/)
    expect(vatNote({ ...base, smallBusiness: false })).toMatch(/includes statutory VAT/)
    expect(vatNote(base)).toMatch(/\[\[VAT NOTE/)
  })
  it('marks pages with open placeholders as drafts and noindexes the thanks page', () => {
    const draft = parseShopConfig(LINK)!
    const pages = shopPages(draft, { analyticsHost: null })
    expect(pages.map((p) => p.dir)).toEqual(['impressum', 'privacy', 'withdrawal', 'thanks'])
    const imp = renderPage(SHELL, pages[0])
    expect(imp).toContain('Draft template')
    expect(findPlaceholders(imp).length).toBeGreaterThan(0)
    expect(renderPage(SHELL, pages[3])).toContain('content="noindex, nofollow"')
    expect(renderPage(SHELL, pages[0])).toContain('content="index, follow"')
  })
  it('has no placeholders left once everything is supplied', () => {
    const c = parseShopConfig({
      ...LINK,
      DOWNLOAD_URL: 'https://files.example.org/inheritance.zip',
      LEGAL_DETAILS: JSON.stringify({ name: 'Erika Mustermann', street: 'Musterstr. 1', postalCity: '10115 Berlin', email: 'hello@example.org', smallBusiness: false, disputeResolution: 'unwilling', deliveryHost: 'itch.io' }),
    })!
    const pages = shopPages(c, { analyticsHost: 'stats.example.org' })
    expect(findPlaceholders(pages.map((p) => p.body).join(''))).toEqual([])
    expect(pages.find((p) => p.dir === 'privacy')!.body).toContain('itch.io')
    expect(pages.find((p) => p.dir === 'impressum')!.body).toContain('neither willing nor obliged')
    expect(pages.find((p) => p.dir === 'privacy')!.body).toContain('stats.example.org')
    expect(buyNote(c)).toContain('Price includes statutory VAT.')
  })
  it('discloses Stripe in the privacy text whenever the buy button exists', () => {
    expect(privacyParagraph(null, true)).toMatch(/Stripe/)
    expect(privacyParagraph(null)).not.toMatch(/Stripe/)
  })
})

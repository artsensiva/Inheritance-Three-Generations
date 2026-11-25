import { describe, expect, it } from 'vitest'
import { parseAnalyticsConfig } from '../scripts/analytics'
import { analyticsOrigins, csp, hardenHead, notFoundPage, parseSiteUrl, sitemap } from '../scripts/headers'

const GC = parseAnalyticsConfig({ ANALYTICS_SCRIPT_SRC: 'https://gc.zgo.at/count.js', ANALYTICS_ATTRS: '{"data-goatcounter":"https://me.goatcounter.com/count"}' })!

describe('SITE_URL', () => {
  it('is optional, https only, and normalised to a trailing slash', () => {
    expect(parseSiteUrl({})).toBeNull()
    expect(parseSiteUrl({ SITE_URL: 'https://a.example/b' })!.toString()).toBe('https://a.example/b/')
    expect(() => parseSiteUrl({ SITE_URL: 'http://a.example/' })).toThrow(/https/)
    expect(() => parseSiteUrl({ SITE_URL: 'https://a.example/?x=1' })).toThrow()
    expect(() => parseSiteUrl({ SITE_URL: 'nope' })).toThrow()
  })
  it('builds a sitemap from absolute URLs', () => {
    const xml = sitemap(parseSiteUrl({ SITE_URL: 'https://a.example/b/' })!, ['play', 'privacy'])
    expect(xml).toContain('<loc>https://a.example/b/</loc>')
    expect(xml).toContain('<loc>https://a.example/b/play/</loc>')
    expect(xml).toContain('<loc>https://a.example/b/privacy/</loc>')
  })
})

describe('content security policy', () => {
  it('allows nothing from other origins by default', () => {
    const p = csp('page', null)
    expect(p).toContain("default-src 'none'")
    expect(p).toContain("script-src 'self'")
    expect(p).not.toMatch(/unsafe-inline|https:/)
    expect(p).toContain("form-action 'none'")
  })
  it('allows the analytics script and its reporting origin, and only those', () => {
    expect(analyticsOrigins(GC).sort()).toEqual(['https://gc.zgo.at', 'https://me.goatcounter.com'])
    const p = csp('page', GC)
    expect(p).toContain("script-src 'self' https://gc.zgo.at https://me.goatcounter.com")
    expect(p).toContain("img-src 'self' data: https://gc.zgo.at https://me.goatcounter.com")
  })
  it('lets only the demo use inline style attributes and blob images', () => {
    expect(csp('app', null)).toContain("style-src 'self' 'unsafe-inline'")
    expect(csp('app', null)).toContain('blob:')
    expect(csp('page', null)).not.toContain('blob:')
  })
})

describe('head hardening', () => {
  const doc = '<!doctype html><html><head><title>x</title></head><body></body></html>'
  it('adds the policy once, with canonical tags only when given', () => {
    const a = hardenHead(doc, { kind: 'page', analytics: null })
    expect(a).toContain('http-equiv="Content-Security-Policy"')
    expect(a).not.toContain('canonical')
    expect(hardenHead(a, { kind: 'page', analytics: null })).toBe(a)
    expect(hardenHead(doc, { kind: 'page', analytics: null, canonical: 'https://a.example/' })).toContain('<link rel="canonical" href="https://a.example/" />')
    expect(() => hardenHead('<html></html>', { kind: 'page', analytics: null })).toThrow()
  })
  it('builds a 404 page with absolute links when the site address is known', () => {
    const h = notFoundPage(parseSiteUrl({ SITE_URL: 'https://a.example/b/' }), null)
    expect(h).toContain('href="/b/landing.css"')
    expect(h).toContain('noindex')
    expect(notFoundPage(null, null)).toContain('href="./landing.css"')
  })
})

import { describe, expect, it } from 'vitest'
import { analyticsLoader, injectLoader, parseAnalyticsConfig, privacyParagraph } from '../scripts/analytics'

const CFG = { ANALYTICS_SCRIPT_SRC: 'https://stats.example.org/script.js', ANALYTICS_ATTRS: '{"data-website-id":"abc-123"}' }

describe('analytics config', () => {
  it('is off unless a script URL is set', () => {
    expect(parseAnalyticsConfig({})).toBeNull()
    expect(parseAnalyticsConfig({ ANALYTICS_SCRIPT_SRC: '   ' })).toBeNull()
  })
  it('accepts an https script with data-* attributes', () => {
    const c = parseAnalyticsConfig(CFG)!
    expect(c.host).toBe('stats.example.org')
    expect(c.attrs).toEqual({ 'data-website-id': 'abc-123' })
  })
  it('rejects unsafe or malformed configuration', () => {
    expect(() => parseAnalyticsConfig({ ANALYTICS_SCRIPT_SRC: 'http://stats.example.org/s.js' })).toThrow(/https/)
    expect(() => parseAnalyticsConfig({ ANALYTICS_SCRIPT_SRC: 'javascript:alert(1)' })).toThrow()
    expect(() => parseAnalyticsConfig({ ANALYTICS_SCRIPT_SRC: 'not a url' })).toThrow()
    expect(() => parseAnalyticsConfig({ ...CFG, ANALYTICS_ATTRS: '{"onload":"x()"}' })).toThrow(/data-\*/)
    expect(() => parseAnalyticsConfig({ ...CFG, ANALYTICS_ATTRS: '["data-a"]' })).toThrow(/object/)
    expect(() => parseAnalyticsConfig({ ...CFG, ANALYTICS_ATTRS: '{nope' })).toThrow(/JSON/)
    expect(() => parseAnalyticsConfig({ ...CFG, ANALYTICS_ATTRS: JSON.stringify({ 'data-a': 'x'.repeat(301) }) })).toThrow()
  })
})

function runLoader(nav: Record<string, unknown>, win: Record<string, unknown> = {}) {
  const appended: { src?: string; defer?: boolean; attrs: Record<string, string> }[] = []
  const document = {
    head: { appendChild: (el: (typeof appended)[number]) => appended.push(el) },
    createElement: () => {
      const el: { src?: string; defer?: boolean; attrs: Record<string, string>; setAttribute: (k: string, v: string) => void } = { attrs: {}, setAttribute(k, v) { el.attrs[k] = v } }
      return el
    },
  }
  const window = { navigator: nav, ...win }
  new Function('window', 'document', analyticsLoader(parseAnalyticsConfig(CFG)!))(window, document)
  return appended
}

describe('analytics loader', () => {
  it('loads the provider script normally', () => {
    const a = runLoader({})
    expect(a).toHaveLength(1)
    expect(a[0].src).toBe('https://stats.example.org/script.js')
    expect(a[0].defer).toBe(true)
    expect(a[0].attrs).toEqual({ 'data-website-id': 'abc-123' })
  })
  it('does nothing when the browser sends Do Not Track or Global Privacy Control', () => {
    expect(runLoader({ doNotTrack: '1' })).toHaveLength(0)
    expect(runLoader({ msDoNotTrack: '1' })).toHaveLength(0)
    expect(runLoader({}, { doNotTrack: '1' })).toHaveLength(0)
    expect(runLoader({ globalPrivacyControl: true })).toHaveLength(0)
  })
})

describe('injection and privacy text', () => {
  it('injects the same-origin loader once, before </head>', () => {
    const html = '<html><head><title>x</title></head><body></body></html>'
    const once = injectLoader(html, './analytics.js')
    expect(once).toContain('<script defer src="./analytics.js"></script>\n</head>')
    expect(injectLoader(once, './analytics.js')).toBe(once)
    expect(() => injectLoader('<html></html>', './a.js')).toThrow()
  })
  it('keeps the privacy statement truthful in both states', () => {
    expect(privacyParagraph(null)).toMatch(/no tracking/)
    const on = privacyParagraph(parseAnalyticsConfig(CFG))
    expect(on).not.toMatch(/no tracking/)
    expect(on).toContain('stats.example.org')
    expect(on).toMatch(/Do Not Track/)
  })
})

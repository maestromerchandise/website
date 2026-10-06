import assert from 'node:assert/strict'
import test from 'node:test'
import { externalUrl, siteHref } from '../src/lib/url.ts'

test('externalUrl keeps an http and https address', () => {
  assert.equal(externalUrl('https://instagram.com/maestro'), 'https://instagram.com/maestro')
  assert.equal(externalUrl('http://maps.example.com/x'), 'http://maps.example.com/x')
})

test('externalUrl drops a scheme that executes or embeds', () => {
  for (const value of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ]) {
    assert.equal(externalUrl(value), undefined, value)
  }
})

test('externalUrl drops anything that is not an address', () => {
  assert.equal(externalUrl(undefined), undefined)
  assert.equal(externalUrl(''), undefined)
  assert.equal(externalUrl('not a url'), undefined)
  assert.equal(externalUrl('/a/path'), undefined)
})

test('siteHref keeps a path on this site', () => {
  assert.equal(siteHref('/'), '/')
  assert.equal(siteHref('/about/'), '/about/')
  assert.equal(siteHref('/#ready-made'), '/#ready-made')
})

test('siteHref drops another host and every scheme', () => {
  for (const value of ['//evil.test/x', 'https://evil.test', 'javascript:alert(1)', 'about/', '']) {
    assert.equal(siteHref(value), undefined, value)
  }
})

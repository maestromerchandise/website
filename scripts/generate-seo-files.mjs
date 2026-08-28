/**
 * Write robots.txt and sitemap.xml into dist/ after a build.
 *
 * Both need the live domain, which is not known until the site is deployed, so
 * it comes from SITE_URL rather than being committed. The site is two pages, so
 * the sitemap is written directly rather than crawled.
 */
import { writeFileSync } from 'node:fs'

const DEFAULT_SITE_URL = 'https://www.maestro.com'

const siteUrl = (process.env.SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, '')
const today = new Date().toISOString().slice(0, 10)

const pages = [
  { path: '/', priority: '1.0' },
  { path: '/about/', priority: '0.8' },
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

// /studio/ is the editing tool, not part of the site. It already carries a
// noindex meta tag; this keeps a crawler from spending requests on it at all.
const robots = `User-agent: *
Allow: /
Disallow: /studio/

Sitemap: ${siteUrl}/sitemap.xml
`

writeFileSync('dist/sitemap.xml', sitemap)
writeFileSync('dist/robots.txt', robots)

console.log(`Wrote dist/sitemap.xml and dist/robots.txt for ${siteUrl}`)
if (siteUrl === DEFAULT_SITE_URL) {
  console.log('Using the default domain. Set SITE_URL to the real one before deploying.')
}

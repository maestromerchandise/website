# Maestro Merchandise

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-4.15-F03E2F?logo=sanity&logoColor=white)
![Status](https://img.shields.io/badge/Status-WIP-D29922)

Company profile and product catalogue for Maestro, a premium corporate merchandising and branding company. The site builds to plain static files for shared hosting and reads all of its content from Sanity, so staff can edit it without a developer.

Two pages only: the home page is one long anchor-scrolled document, and About is a real file at `/about/`.

## Setup

```bash
npm install               # installs the website and the Studio together
cp .env.example .env      # then fill in the values by hand
npm run dev               # http://localhost:5137
```

Without a `.env` the site renders from `content/seed.json`, so the design can be reviewed before a Sanity project exists.

### Sanity

The Studio lives in `studio/` in this repository and is an npm workspace, so the
root `npm install` sets it up too.

```bash
cp studio/.env.example studio/.env   # then fill in the values by hand
npx sanity login
```

Register every browser origin that will read the project. Sanity holds this as an allowlist on its own servers, so it cannot be set in `.env`, and until an origin is on the list both the Studio and the catalogue fail with a CORS error:

```bash
npm run cors -- http://localhost:5137 --credentials   # the dev server
npm run cors -- https://www.yourdomain.com --credentials
npm run cors:list                                     # what is already allowed
```

The Studio is served by the site itself at [/studio](http://localhost:5137/studio), so `npm run dev` is all that is needed to edit content. It is also still available on its own:

```bash
npm run studio                       # http://localhost:3333
```

Publish the editing interface to a free `<project>.sanity.studio` address, which keeps it off the web host:

```bash
npm run studio:deploy
```

Load the copy transcribed from `Web Maestro.pdf` into an empty dataset. It uses `createIfNotExists`, so running it twice never overwrites an edit made in Studio:

```bash
npm run seed        # needs SANITY_WRITE_TOKEN
npm run seed:cli    # same content through the logged-in CLI, no token needed
```

Attach a folder of product photography. The tree is `<NN. Category>/<page>/<Collection> - <Product>.png`; only `.png` is read, and a subject is attached only where its name matches a product, so a photograph never lands on the wrong one. It reports first and uploads nothing until `APPLY=1`:

```bash
IMAGES_DIR=/path/to/images npx sanity exec scripts/upload-images.mjs --with-user-token
IMAGES_DIR=/path/to/images APPLY=1 npx sanity exec scripts/upload-images.mjs --with-user-token
```

Put the dataset back to the state it started in, which is how a test project is cleared before it changes hands. Both delete the dataset and recreate it, so every document and every uploaded image goes with it:

```bash
npm run dataset:reset   # back to the seeded content, images gone
npm run dataset:clear   # left completely empty
```

### Handing the project to its owner

The site and the Studio both read the `VITE_` pair, so the owner fills in one file at the root and nothing else. `studio/.env` is only needed by `npm run studio` and `npm run studio:deploy`, which the embedded Studio at `/studio` replaces.

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage) and copy its project id
2. `cp .env.example .env`, then fill in the project id and dataset
3. `npx sanity login` as the account that owns the project
4. `npm run cors -- http://localhost:5137 --credentials`, and again for the live domain
5. `npm run seed:cli` to put the starting content in place

## Usage

```bash
npm run build     # typecheck, build to dist/, then write robots.txt and sitemap.xml
npm run preview   # serve dist/ locally
```

Set the live domain when building for production, or the sitemap and `robots.txt` point at the placeholder:

```bash
SITE_URL=https://www.yourdomain.com npm run build
```

## What Editors Can Change

Everything below is edited in Studio and takes effect without a deploy.

| Document | Controls |
| :- | :- |
| Site settings | Site address, WhatsApp number and message templates, enquiry e-mail, contact details, header navigation, footer line, SEO defaults |
| Home page | Hero lines, every section heading and intro, featured product order, client logos, chat FAQ, page SEO |
| About page | Introduction, image, Why Choose Us, Our Service, page SEO |
| Products | Name, category, tagline, descriptions, features, specifications, colours with their own photographs, images, Ready-Made flag, order |
| Product categories | Name, section id, card image, whether it appears in the row, order |

A product colour can carry its own photograph. When it does, choosing that colour on the website swaps the picture to match, so the swatches show the product rather than only naming it. A colour with no photograph leaves the current image in place, which means the photographs can be added gradually.

SEO per page covers meta title, meta description, share title, share description, share image, canonical URL and a noindex switch. An empty field falls back to the global default in Site settings, then to what the HTML shipped.

## Configuration

Names only. See `.env.example`, and never commit a real value.

| Variable | Required | Description |
| :- | :- | :- |
| `VITE_SANITY_PROJECT_ID` | Yes | Sanity project the content is read from |
| `VITE_SANITY_DATASET` | Yes | Sanity dataset name, normally `production` |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4. Left empty, no analytics script loads at all |
| `SANITY_WRITE_TOKEN` | No | Used by `npm run seed` only. No `VITE_` prefix, so it stays out of the bundle |
| `SITE_URL` | No | Build-time only. The domain written into `robots.txt` and `sitemap.xml` |

The `studio/` package reads `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` from its own `.env`.

Every `VITE_` value is compiled into the JavaScript bundle and is public. That is correct for all three: the Sanity dataset is public-read, and a GA4 measurement id identifies a property without authorising anything.

## Enquiries

The Get in touch form opens the visitor's own mail application with the enquiry already written, addressed to the enquiry e-mail set in Site settings. There is no backend, no database and no transactional mail service, so nothing is stored and no credential ships in the bundle.

The body leads with the visitor's WhatsApp number, because that is how the team replies. WhatsApp is the primary channel throughout: a floating button, a prefilled link in every product detail panel, and a CTA in the Custom Gift and Custom Box sections.

## Analytics

Google Analytics 4, loaded only when a measurement id is set in Studio under **Site settings > Analytics**. It is not a build-time value, so the owner can add or change the property without a redeploy, and a site with the field empty makes no request to Google at all. All tracking goes through `src/lib/analytics.ts`; no component touches `gtag` directly.

Tracked: page views, product detail opens, category clicks, Ready-Made opens, Custom Gift and Custom Box CTAs, enquiry submissions, WhatsApp clicks by location, chat opens and questions, and About navigation.

**No personal data is ever sent.** Events carry a product title, a category name or a section id, all of which are already public page content. No name, e-mail address, phone number or message body reaches Analytics.

## Deploying to Hostinger

1. Build with the real domain: `SITE_URL=https://www.yourdomain.com npm run build`.
2. Upload everything inside `dist/` to `public_html`, including the hidden `.htaccess`.
3. The site must sit at the domain root, because both entry points reference `/assets/` by absolute path.

`/about/` is a real directory containing a real `index.html`, so Apache serves it directly. A refresh cannot 404 and no rewrite rules are needed. The `.htaccess` only sets cache headers: fingerprinted assets are immutable for a year, HTML always revalidates.

### Domain and SSL

1. In Hostinger, point the domain at the hosting account, or set the registrar's nameservers to Hostinger's.
2. Wait for DNS to propagate, then issue the free SSL certificate from the Hostinger panel.
3. Turn on the "force HTTPS" option, so `http://` visitors are redirected.
4. Set the same address as the production site address in Site settings, with `https` and no trailing slash, so canonical links match what visitors actually load.

## Project Structure

```text
index.html          # home entry, served at /
about/index.html    # about entry, served at /about/
src/
  App.tsx           # home page
  About.tsx         # about page
  index.css         # design tokens and every style
  components/       # header, marquee, grid, dialog, form, chat, WhatsApp, footer
  lib/              # config, Sanity read, SEO, analytics, WhatsApp, enquiry, scroll
studio/             # Sanity Studio, an npm workspace with its own dependencies
scripts/            # content seed, and the robots/sitemap generator
content/seed.json   # copy transcribed from the source PDF
test/               # node:test, no test framework
```

React and React DOM are the only runtime dependencies. Sanity is read through `fetch` against its CDN query endpoint, product detail opens inside the page, and the client logo strip is a native scroll container. Each of those replaced a package.

## Development

```bash
npm run lint
npm test
npm run build
npm run typecheck --workspace studio
```

Images are never pre-compressed. Sanity's asset CDN resizes and re-encodes on request, free on every plan, so originals are uploaded untouched and `src/lib/img.ts` asks for the size the page needs. An 800px WebP product shot on white lands well under 100KB.

## Known Limitations

- No product photography or client logos yet. Missing images render as a neutral "image pending" tile rather than a broken image.
- The enquiry form depends on the visitor having a mail application configured. When they do not, nothing visibly happens, which is why the status line points at WhatsApp as the alternative.
- Search filters the products already in memory. Past roughly 500 products it should become a GROQ `match` query.
- Content is fetched at runtime, so a first paint shows a loading line and a crawler that does not run JavaScript sees only the metadata compiled into the HTML.
- Colour values in `content/seed.json` are read off the mockup swatches and need confirming against the real finishes.

## License

Proprietary. All rights reserved.

# Maestro Merchandise

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-4.15-F03E2F?logo=sanity&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Status](https://img.shields.io/badge/Status-WIP-D29922)

Company profile and product catalogue for Maestro, a premium corporate merchandising and branding company. The site builds to plain static files for shared hosting, reads its catalogue from Sanity so staff can edit it without a developer, and writes contact enquiries to Supabase.

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values by hand
npm run dev               # http://localhost:5173
```

The site needs a Sanity project and a Supabase project before it renders anything.

### Sanity

```bash
cd studio
npm install
cp .env.example .env      # then fill in the values by hand
npx sanity login
npm run dev               # http://localhost:3333
```

Publish the editing interface to a free `<project>.sanity.studio` address, which
keeps it off the web host:

```bash
cd studio
npm run deploy
```

Load the copy transcribed from `Web Maestro.pdf` into an empty dataset. It uses
`createIfNotExists`, so running it twice never overwrites an edit made in
Studio:

```bash
npm run seed
```

### Supabase

Open the SQL editor in the Supabase dashboard and run `supabase/schema.sql`. It
creates the `leads` table, its constraints and the insert-only row level
security policy that makes the published anon key safe to ship.

## Usage

```bash
npm run build     # typecheck, then build to dist/
npm run preview   # serve dist/ locally
```

Deploy by uploading everything inside `dist/` to `public_html`, including the
`.htaccess` file. The site must sit at the domain root, because both entry
points reference `/assets/` by absolute path.

## Configuration

Names only. See `.env.example`, and never commit a real value.

| Variable | Required | Description |
| :- | :- | :- |
| `VITE_SANITY_PROJECT_ID` | Yes | Sanity project the catalogue is read from |
| `VITE_SANITY_DATASET` | Yes | Sanity dataset name, normally `production` |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL the contact form posts to |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable key, safe only alongside the insert-only policy |
| `SANITY_WRITE_TOKEN` | No | Used by `npm run seed` only. No `VITE_` prefix, so it stays out of the bundle |

The `studio/` package reads `SANITY_STUDIO_PROJECT_ID` and
`SANITY_STUDIO_DATASET` from its own `.env`.

Every `VITE_` value is compiled into the JavaScript bundle and is public. That
is correct for all four: the Sanity dataset is public-read, and the Supabase
anon key can only insert.

## Project Structure

```text
index.html          # home entry, served at /
about/index.html    # about entry, served at /about/
src/
  App.tsx           # home page
  About.tsx         # about page
  main.tsx          # home mount
  about-main.tsx    # about mount
  index.css         # design tokens and every style
  components/       # header, marquee, grid, dialog, form, chat, footer
  lib/              # config, Sanity read, Supabase write, image URLs
studio/             # Sanity Studio, its own package.json and dependencies
scripts/            # one-off content seed
supabase/schema.sql # leads table, constraints and RLS policy
content/seed.json   # copy transcribed from the source PDF
test/               # node:test, no test framework
```

Two HTML entry points rather than a client-side router: Apache resolves
`/about/` to a real file, so a refresh cannot 404 and no rewrite rules are
needed. The home page keeps its product sections as anchors on one document.

React and React DOM are the only runtime dependencies. Sanity is read through
`fetch` against its CDN query endpoint, Supabase through `fetch` against
PostgREST, the product popup is a native `<dialog>`, and the client logo strip
is a native scroll container. Each of those replaced a package.

## Development

```bash
npm run lint
npm test
npm run build
```

Images are never pre-compressed. Sanity's asset CDN resizes and re-encodes on
request, free on every plan, so originals are uploaded untouched and
`src/lib/img.ts` asks for the size the page needs. An 800px WebP product shot on
white lands well under 100KB.

## Known Limitations

- No product photography or client logos yet. Missing images render as a
  neutral "image pending" tile rather than a broken image.
- Supabase stores leads but sends no notification. Someone has to open the
  dashboard, so the WhatsApp link is the primary call to action. A Database
  Webhook can add email later without touching the frontend.
- The contact form has a honeypot and length constraints but no rate limiting,
  which is not possible without a server. Cloudflare Turnstile is the fallback
  if spam arrives.
- Search filters the products already in memory. Past roughly 500 products it
  should become a GROQ `match` query.
- Content is fetched at runtime, so a first paint shows a loading line. If that
  becomes noticeable, a build-time snapshot can seed the initial state.
- Colour values in `content/seed.json` are read off the mockup swatches and need
  confirming against the real finishes.

## License

Proprietary. All rights reserved.

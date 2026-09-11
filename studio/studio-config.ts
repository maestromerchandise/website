import { createElement } from 'react'
import { buildLegacyTheme, defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { aboutPage } from './schemas/aboutPage'
import { homepage } from './schemas/homepage'
import { product } from './schemas/product'
import { productCategory } from './schemas/productCategory'
import { seo } from './schemas/seo'
import { siteSettings } from './schemas/siteSettings'

/**
 * The Studio in the site's own palette: a white ground, the warm taupe the site
 * uses for its buttons as the brand colour, and its muted grey for secondary
 * text. The values come from the tokens at the top of src/index.css.
 *
 * `--black` is a deeper shade of the same brown rather than the site's body text
 * colour. #7b6e63 suits a paragraph on the site but is too faint for the dense
 * labels and field values of an editing tool, so the darkest tone is pulled
 * down to keep those readable.
 *
 * The state colours stay at Sanity's defaults on purpose: an error has to look
 * like an error, not like another shade of brown.
 */
const maestroTheme = buildLegacyTheme({
  '--black': '#3b332d',
  '--white': '#ffffff',
  '--gray': '#a89c91',
  '--gray-base': '#a89c91',
  '--component-bg': '#ffffff',
  '--component-text-color': '#3b332d',
  '--brand-primary': '#82756a',
  '--default-button-color': '#7b6e63',
  '--default-button-primary-color': '#82756a',
  '--focus-color': '#82756a',
  '--main-navigation-color': '#ffffff',
  '--main-navigation-color--inverted': '#3b332d',
  '--font-family-base': 'Montserrat, system-ui, sans-serif',
})

/**
 * The workspace badge, in the brand colour instead of Sanity's default green,
 * which was the one element of the Studio still off the site's palette.
 *
 * Written with createElement because this file is shared with the CLI config
 * and stays plain TypeScript rather than JSX.
 */
function MaestroIcon() {
  return createElement(
    'svg',
    { viewBox: '0 0 32 32', width: '100%', height: '100%', 'aria-hidden': true },
    createElement('rect', { width: 32, height: 32, rx: 6, fill: '#82756a' }),
    createElement(
      'text',
      {
        x: 16,
        y: 21.5,
        textAnchor: 'middle',
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'Montserrat, system-ui, sans-serif',
        fill: '#ffffff',
      },
      'M',
    ),
  )
}

/** Documents that exist exactly once, pinned so nobody can create a second. */
const SINGLETONS = [
  { type: 'siteSettings', title: 'Site Settings' },
  { type: 'homepage', title: 'Home Page' },
  { type: 'aboutPage', title: 'About Page' },
]

/**
 * The Studio, minus the project it points at.
 *
 * Built as a factory because the same Studio is mounted two ways: the CLI reads
 * `SANITY_STUDIO_*` from the shell for `sanity deploy`, while the copy embedded
 * at /studio is a browser bundle and can only see Vite's `VITE_*` values. Taking
 * the ids as arguments keeps one definition of the schema and the structure
 * rather than two that drift apart.
 *
 * `basePath` is what tells the Studio router which part of the URL is not its
 * own. Mounted at /studio without it, the router reads the first segment as the
 * name of a tool and fails with "Tool not found: studio". The deployed Studio
 * sits at the root of its own host and passes nothing.
 */
export function createStudioConfig({
  projectId,
  dataset,
  basePath,
}: {
  projectId: string
  dataset: string
  basePath?: string
}) {
  return defineConfig({
    name: 'maestro',
    title: 'Maestro',
    icon: MaestroIcon,
    projectId,
    dataset,
    ...(basePath ? { basePath } : {}),
    theme: maestroTheme,
    schema: {
      types: [product, productCategory, homepage, aboutPage, siteSettings, seo],
      // A singleton is one fixed document, so it is never offered in the
      // "create new" menu; it is only reachable through the pinned list item.
      templates: (templates) =>
        templates.filter((template) => !SINGLETONS.some((s) => s.type === template.schemaType)),
    },
    document: {
      actions: (actions, { schemaType }) =>
        SINGLETONS.some((s) => s.type === schemaType)
          ? actions.filter(({ action }) => action !== 'duplicate' && action !== 'delete')
          : actions,
    },
    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Content')
            .items([
              ...SINGLETONS.map((singleton) =>
                S.listItem()
                  .title(singleton.title)
                  .id(singleton.type)
                  .child(S.document().schemaType(singleton.type).documentId(singleton.type)),
              ),
              S.divider(),
              S.documentTypeListItem('product').title('Products'),
              S.documentTypeListItem('productCategory').title('Product Categories'),
            ]),
      }),
    ],
  })
}

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { aboutPage } from './schemas/aboutPage'
import { homepage } from './schemas/homepage'
import { product } from './schemas/product'
import { productCategory } from './schemas/productCategory'
import { seo } from './schemas/seo'
import { siteSettings } from './schemas/siteSettings'

/** Documents that exist exactly once, pinned so nobody can create a second. */
const SINGLETONS = [
  { type: 'siteSettings', title: 'Site settings' },
  { type: 'homepage', title: 'Home page' },
  { type: 'aboutPage', title: 'About page' },
]

/**
 * The Studio, minus the project it points at.
 *
 * Built as a factory because the same Studio is mounted two ways: the CLI reads
 * `SANITY_STUDIO_*` from the shell for `sanity deploy`, while the copy embedded
 * at /studio is a browser bundle and can only see Vite's `VITE_*` values. Taking
 * the ids as arguments keeps one definition of the schema and the structure
 * rather than two that drift apart.
 */
export function createStudioConfig({ projectId, dataset }: { projectId: string; dataset: string }) {
  return defineConfig({
    name: 'maestro',
    title: 'Maestro',
    projectId,
    dataset,
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
              S.documentTypeListItem('productCategory').title('Product categories'),
            ]),
      }),
    ],
  })
}

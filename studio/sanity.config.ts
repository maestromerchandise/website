import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { homepage } from './schemas/homepage'
import { product } from './schemas/product'

export default defineConfig({
  name: 'maestro',
  title: 'Maestro',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  schema: { types: [product, homepage] },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Site content is a singleton, so it is pinned to one document
            // rather than listed as a type anyone could create a second of.
            S.listItem()
              .title('Site content')
              .child(S.document().schemaType('homepage').documentId('homepage')),
            S.documentTypeListItem('product').title('Products'),
          ]),
    }),
  ],
})

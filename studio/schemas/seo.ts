import { defineField, defineType } from 'sanity'

/**
 * Per-page SEO, reused by the Home and About documents.
 *
 * Every field is optional: an empty one falls back to the global default in
 * siteSettings, and only then to the value compiled into the HTML. That order
 * means a half-filled form degrades rather than publishing a blank title.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  // Always laid open. Folded away, the SEO fields read as a closed menu and were
  // easy to miss; open, every field and its hint shows at a glance.
  options: { collapsible: false },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Shown in the browser tab and as the search result headline. Around 60 characters.',
      validation: (rule) => rule.max(70).warning('Search results usually cut off past 60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'The grey summary under a search result. Around 155 characters.',
      validation: (rule) => rule.max(180).warning('Search results usually cut off past 155 characters.'),
    }),
    defineField({
      name: 'ogTitle',
      title: 'Share Title',
      type: 'string',
      description: 'Used when the page is shared to WhatsApp, Instagram or LinkedIn. Falls back to the meta title.',
    }),
    defineField({
      name: 'ogDescription',
      title: 'Share Description',
      type: 'text',
      rows: 3,
      description: 'Falls back to the meta description.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Share Image',
      type: 'image',
      description: 'Shown as the preview card when the page is shared. 1200 x 630 works everywhere.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description:
        'Only set this to point search engines at a different address. Left empty, the site URL plus this page path is used.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide From Search Engines',
      type: 'boolean',
      description: 'Turn on to keep this page out of Google. Leave off for a live page.',
      initialValue: false,
    }),
  ],
})

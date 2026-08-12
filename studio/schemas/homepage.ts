import { defineArrayMember, defineField, defineType } from 'sanity'

/** The editable heading and copy for one section of the home page. */
const sectionCopy = (name: string, title: string, defaults: { heading: string; intro?: string }) =>
  defineField({
    name,
    title,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [
      { name: 'heading', type: 'string', initialValue: defaults.heading },
      ...(defaults.intro
        ? [{ name: 'intro', title: 'Intro copy', type: 'text' as const, rows: 3, initialValue: defaults.intro }]
        : []),
    ],
  })

const CUSTOM_COPY =
  'Elevate your brand through bespoke merchandise and refined gifting solutions. ' +
  'Contact us to discuss your requirements and explore limitless customisation possibilities.'

/** Singleton holding the home page copy and its curated product ordering. */
export const homepage = defineType({
  name: 'homepage',
  title: 'Home page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'sections', title: 'Sections' },
    { name: 'clients', title: 'Clients' },
    { name: 'faq', title: 'Chat FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'heroTitle',
      type: 'string',
      group: 'hero',
      initialValue: 'Modern merchandising. Responsible impact',
    }),
    defineField({
      name: 'heroSubtitle',
      type: 'string',
      group: 'hero',
      initialValue: 'Premium corporate & sustainable branding solutions',
    }),

    sectionCopy('clientsSection', 'Clients section', { heading: 'Our satisfied clients' }),
    sectionCopy('readyMadeSection', 'Ready-Made section', { heading: 'Ready-Made' }),
    sectionCopy('customGiftSection', 'Custom Gift section', { heading: 'Custom Gift', intro: CUSTOM_COPY }),
    sectionCopy('customBoxSection', 'Custom Box section', { heading: 'Custom Box', intro: CUSTOM_COPY }),
    sectionCopy('contactSection', 'Get in touch section', { heading: 'Get in touch' }),

    defineField({
      name: 'contactLead',
      title: 'Get in touch heading copy',
      type: 'object',
      group: 'sections',
      fields: [
        { name: 'title', type: 'string', initialValue: 'We do more than create merchandise' },
        { name: 'subtitle', type: 'string', initialValue: 'End to end service' },
      ],
    }),

    defineField({
      name: 'featuredProducts',
      title: 'Featured products',
      type: 'array',
      group: 'sections',
      description:
        'Drag to reorder. These appear first in their category rows. Leave empty to use each product own order number.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
    }),

    defineField({
      name: 'clientLogos',
      title: 'Client logos',
      // A Sanity array is drag and drop reorderable out of the box, which is
      // also what gives the featured ordering above its ordering control.
      type: 'array',
      group: 'clients',
      description: 'Drag to reorder. Shown in the moving strip.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'name', type: 'string', validation: (rule) => rule.required() },
            { name: 'image', type: 'image' },
          ],
          preview: { select: { title: 'name', media: 'image' } },
        }),
      ],
    }),

    defineField({
      name: 'faq',
      title: 'Chat FAQ',
      type: 'array',
      group: 'faq',
      description: 'Questions and answers offered by the help widget. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'question', type: 'string', validation: (rule) => rule.required() },
            { name: 'answer', type: 'text', rows: 3, validation: (rule) => rule.required() },
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})

import { defineArrayMember, defineField, defineType } from 'sanity'

/** The editable heading and copy for one section of the home page. */
const sectionCopy = (name: string, title: string, defaults: { heading: string; intro?: string }) =>
  defineField({
    name,
    title,
    type: 'object',
    group: 'sections',
    // Open, like every object in the Studio: a folded section read as a closed
    // menu and its fields went unnoticed.
    options: { collapsible: false },
    fields: [
      { name: 'heading', type: 'string', initialValue: defaults.heading },
      ...(defaults.intro
        ? [{ name: 'intro', title: 'Intro Copy', type: 'text' as const, rows: 3, initialValue: defaults.intro }]
        : []),
    ],
  })

const CUSTOM_COPY =
  'Elevate your brand through bespoke merchandise and refined gifting solutions. ' +
  'Contact us to discuss your requirements and explore limitless customisation possibilities.'

/** Singleton holding the home page copy and its curated product ordering. */
export const homepage = defineType({
  name: 'homepage',
  title: 'Home Page',
  type: 'document',
  // No default group, so the document opens on All Fields with everything
  // showing. The tabs only narrow the view when an editor wants them to.
  groups: [
    { name: 'hero', title: 'Hero' },
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

    sectionCopy('clientsSection', 'Clients Section', { heading: 'Our satisfied clients' }),
    sectionCopy('readyMadeSection', 'Ready-Made Section', { heading: 'Ready-Made' }),
    sectionCopy('customGiftSection', 'Custom Gift Section', { heading: 'Custom Gift', intro: CUSTOM_COPY }),
    sectionCopy('customBoxSection', 'Custom Box Section', { heading: 'Custom Box', intro: CUSTOM_COPY }),
    sectionCopy('contactSection', 'Get In Touch Section', { heading: 'Get in touch' }),

    defineField({
      name: 'contactLead',
      title: 'Get In Touch Heading Copy',
      type: 'object',
      group: 'sections',
      options: { collapsible: false },
      fields: [
        { name: 'title', type: 'string', initialValue: 'We do more than create merchandise' },
        { name: 'subtitle', type: 'string', initialValue: 'End to end service' },
      ],
    }),

    defineField({
      name: 'featuredProducts',
      title: 'Featured Products',
      type: 'array',
      group: 'sections',
      description:
        'Drag to reorder. These appear first in their category rows. Leave empty to use each product own order number.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
    }),

    defineField({
      name: 'clientLogos',
      title: 'Client Logos',
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

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      description: 'Any field left empty here uses the SEO Defaults in Site Settings.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Home Page' }) },
})

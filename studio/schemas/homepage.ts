import { defineArrayMember, defineField, defineType } from 'sanity'

const titledEntry = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        fields: [
          { name: 'title', type: 'string', validation: (rule) => rule.required() },
          { name: 'body', type: 'text', rows: 3, validation: (rule) => rule.required() },
        ],
      }),
    ],
  })

/** Singleton holding every piece of copy outside the product catalogue. */
export const homepage = defineType({
  name: 'homepage',
  title: 'Site content',
  type: 'document',
  fields: [
    defineField({ name: 'heroTitle', type: 'string' }),
    defineField({ name: 'heroSubtitle', type: 'string' }),
    defineField({
      name: 'about',
      type: 'text',
      rows: 8,
      description: 'Leave a blank line between paragraphs.',
    }),
    defineField({ name: 'aboutImage', type: 'image', options: { hotspot: true } }),
    titledEntry('whyChooseUs', 'Why Choose Us'),
    titledEntry('services', 'Our Service'),
    defineField({
      name: 'faq',
      title: 'Chat FAQ',
      type: 'array',
      description: 'Questions and answers offered by the help widget.',
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
      name: 'clientLogos',
      title: 'Client logos',
      // A Sanity array is drag and drop reorderable out of the box, which is
      // also what gives the featured ordering below its ordering control.
      type: 'array',
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
      name: 'featuredProducts',
      title: 'Featured products',
      type: 'array',
      description: 'Drag to reorder.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
    }),
    defineField({
      name: 'contact',
      type: 'object',
      fields: [
        { name: 'whatsapp', type: 'url', description: 'Full https://wa.me/ link' },
        { name: 'instagram', type: 'url' },
        { name: 'tiktok', type: 'url' },
        { name: 'mapsUrl', title: 'Google Maps URL', type: 'url' },
        { name: 'address', type: 'string' },
        { name: 'email', type: 'string' },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site content' }) },
})

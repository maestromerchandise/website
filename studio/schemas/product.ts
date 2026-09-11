import { defineField, defineType } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Images' },
    { name: 'placement', title: 'Placement' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 60 },
      description: 'Used as a stable identifier for this product.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      group: 'content',
      to: [{ type: 'productCategory' }],
      description: 'Which section of the home page this product appears in.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      type: 'string',
      group: 'content',
      description: 'The short line above the description, for example "One tool. Endless possibilities."',
    }),
    defineField({ name: 'description', type: 'text', rows: 4, group: 'content' }),
    defineField({
      name: 'features',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
      description: 'One bullet per line item.',
    }),
    defineField({
      name: 'specifications',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
    }),
    defineField({
      name: 'colors',
      title: 'Colours',
      type: 'array',
      group: 'content',
      description:
        'Each colour can carry its own photograph. Choosing the colour on the website then swaps the picture to match.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', validation: (rule) => rule.required() },
            {
              name: 'hex',
              type: 'string',
              description: 'For example #1A1A1A',
              validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }),
            },
            {
              name: 'image',
              title: 'Photograph In This Colour',
              type: 'image',
              options: { hotspot: true },
              description:
                'Shown when this colour is selected. Left empty, the main image stays on screen.',
            },
          ],
          preview: { select: { title: 'name', subtitle: 'hex', media: 'image' } },
        },
      ],
    }),

    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      // Sanity resizes and re-encodes on delivery, so the original is uploaded
      // untouched and the website asks for the size it needs.
      description: 'Upload the highest quality version. The website compresses it automatically.',
    }),
    defineField({
      name: 'gallery',
      title: 'Detail Images',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Extra images shown in the product popup.',
    }),

    defineField({
      name: 'readyMade',
      title: 'Show In Ready-Made',
      type: 'boolean',
      group: 'placement',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'placement',
      description: 'Lower numbers appear first within a category.',
      initialValue: 100,
    }),
  ],
  orderings: [{ name: 'order', title: 'Display Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'category.title', media: 'image' },
  },
})

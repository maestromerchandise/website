import { defineField, defineType } from 'sanity'

/** Kept in step with the Category union in ../../src/lib/sanity.ts. */
export const CATEGORY_OPTIONS = [
  { title: 'Eco Essentials', value: 'eco-essentials' },
  { title: 'Travel Essentials', value: 'travel-essentials' },
  { title: 'Sports', value: 'sports' },
  { title: 'Smart & Tech', value: 'smart-tech' },
  { title: 'Office', value: 'office' },
  { title: 'Home & Living', value: 'home-living' },
  { title: 'Automotive', value: 'automotive' },
  { title: 'Apparel & Wearables', value: 'apparel-wearables' },
  { title: 'Box', value: 'box' },
]

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: { list: CATEGORY_OPTIONS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      type: 'string',
      description: 'The short line above the description, for example "One tool. Endless possibilities."',
    }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({
      name: 'features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'One bullet per line item.',
    }),
    defineField({
      name: 'specifications',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'colors',
      title: 'Colours',
      type: 'array',
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
          ],
          preview: { select: { title: 'name', subtitle: 'hex' } },
        },
      ],
    }),
    defineField({
      name: 'image',
      title: 'Main image',
      type: 'image',
      options: { hotspot: true },
      // Sanity resizes and re-encodes on delivery, so the original is uploaded
      // untouched and the website asks for the size it needs.
      description: 'Upload the highest quality version. The website compresses it automatically.',
    }),
    defineField({
      name: 'gallery',
      title: 'Detail images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Extra images shown in the product popup.',
    }),
    defineField({
      name: 'readyMade',
      title: 'Show in Ready-Made',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Lower numbers appear first within a category.',
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'image' },
  },
})

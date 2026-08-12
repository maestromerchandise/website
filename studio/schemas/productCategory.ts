import { defineField, defineType } from 'sanity'

/**
 * A product category, which is also a section of the home page.
 *
 * Held as documents rather than a fixed list so a category can be added,
 * renamed or reordered without a code change. `slug` becomes the section id the
 * category strip scrolls to, so it must stay stable once links exist.
 */
export const productCategory = defineType({
  name: 'productCategory',
  title: 'Product category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'Shown on the category card and as the section heading, for example Eco Essentials.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Section id',
      type: 'slug',
      options: { source: 'title', maxLength: 40 },
      description:
        'Used in the page address, for example #eco-essentials. Changing it breaks any link already shared.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'anchorOverride',
      title: 'Scroll to another section instead',
      type: 'string',
      description:
        'Leave empty for normal behaviour. Box uses custom-box, so its card scrolls to the Custom Box section rather than repeating the products.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Category image',
      type: 'image',
      options: { hotspot: true },
      description: 'Shown on the category card. Left empty, the first product image is used.',
    }),
    defineField({
      name: 'showInStrip',
      title: 'Show in the category row',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first.',
      initialValue: 100,
    }),
  ],
  orderings: [
    { name: 'order', title: 'Display order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current', media: 'coverImage' } },
})

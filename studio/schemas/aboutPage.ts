import { defineArrayMember, defineField, defineType } from 'sanity'

const titledEntry = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'object',
        fields: [
          { name: 'title', type: 'string', validation: (rule) => rule.required() },
          { name: 'body', type: 'text', rows: 3, validation: (rule) => rule.required() },
        ],
        preview: { select: { title: 'title', subtitle: 'body' } },
      }),
    ],
  })

/** Singleton holding everything on the About page. */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
      group: 'content',
      initialValue: 'About Us',
    }),
    defineField({
      name: 'body',
      title: 'Introduction',
      type: 'text',
      rows: 8,
      group: 'content',
      description: 'Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'image',
      title: 'Introduction image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
    }),
    titledEntry('whyChooseUs', 'Why Choose Us', 'Drag to reorder.'),
    defineField({
      name: 'whyChooseUsImage',
      title: 'Why Choose Us image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
    }),
    titledEntry('services', 'Our Service', 'Drag to reorder.'),
    defineField({
      name: 'servicesImage',
      title: 'Our Service image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
})

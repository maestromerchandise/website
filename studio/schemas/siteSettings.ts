import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Global settings: one document, edited in one place.
 *
 * Everything here is read by both pages, so a change to the WhatsApp number or
 * the enquiry address takes effect across the whole site without a deploy.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'whatsapp', title: 'WhatsApp' },
    { name: 'contact', title: 'Contact' },
    { name: 'navigation', title: 'Navigation and footer' },
    { name: 'seo', title: 'SEO defaults' },
  ],
  fields: [
    defineField({
      name: 'siteUrl',
      title: 'Production site address',
      type: 'url',
      group: 'general',
      description:
        'The live address, with https and no trailing slash, for example https://www.maestro.com. Canonical links and the sitemap are built from this.',
      validation: (rule) => rule.required(),
      initialValue: 'https://www.maestro.com',
    }),
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      group: 'general',
      initialValue: 'Maestro',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mastheadText',
      title: 'Masthead line',
      type: 'string',
      group: 'general',
      description: 'The small centred line above the header.',
      initialValue: 'www.maestro.com',
    }),

    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp number',
      type: 'string',
      group: 'whatsapp',
      description:
        'Country code and number, digits only, no plus and no spaces. Indonesia starts 62, so 0812 3456 7890 is written 6281234567890.',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[1-9][0-9]{7,14}$/, { name: 'digits only, starting with the country code' })
          .error('Digits only, starting with the country code. No plus sign, spaces or leading zero.'),
      initialValue: '6281234567890',
    }),
    defineField({
      name: 'whatsappDefaultMessage',
      title: 'Default WhatsApp message',
      type: 'string',
      group: 'whatsapp',
      description: 'Pre-filled when someone taps a general WhatsApp button.',
      initialValue: 'Hello Maestro, I would like to ask about your merchandise.',
    }),
    defineField({
      name: 'whatsappProductMessage',
      title: 'Product WhatsApp message',
      type: 'string',
      group: 'whatsapp',
      description:
        'Pre-filled from a product popup. Write {product} where the product name should appear.',
      initialValue: 'Hello Maestro, I would like to ask about {product}.',
    }),

    defineField({
      name: 'enquiryEmail',
      title: 'Enquiry e-mail address',
      type: 'string',
      group: 'contact',
      description:
        'Where the Get in touch form sends its enquiry. The visitor sends it from their own mail app, so this address is visible to them.',
      validation: (rule) => rule.required().email(),
      initialValue: 'hello@maestro.com',
    }),
    defineField({
      name: 'enquirySubject',
      title: 'Enquiry e-mail subject',
      type: 'string',
      group: 'contact',
      description: 'Write {name} where the visitor name should appear.',
      initialValue: 'Website enquiry from {name}',
    }),
    defineField({
      name: 'contact',
      title: 'Contact details',
      type: 'object',
      group: 'contact',
      fields: [
        { name: 'address', type: 'string' },
        { name: 'email', title: 'Public e-mail', type: 'string' },
        { name: 'phone', title: 'Public phone', type: 'string' },
        { name: 'instagram', type: 'url' },
        { name: 'tiktok', type: 'url' },
        { name: 'mapsUrl', title: 'Google Maps URL', type: 'url' },
      ],
    }),

    defineField({
      name: 'navigation',
      title: 'Header navigation',
      type: 'array',
      group: 'navigation',
      description:
        'Drag to reorder. Use /#section for a place on the home page, such as /#ready-made, and /about/ for the About page.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'label', type: 'string', validation: (rule) => rule.required() },
            {
              name: 'href',
              title: 'Link',
              type: 'string',
              validation: (rule) =>
                rule
                  .required()
                  .regex(/^(\/#[a-z0-9-]+|\/about\/|\/)$/, { name: 'site link' })
                  .error('Use /#section-id, /about/ or /'),
            },
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        }),
      ],
    }),
    defineField({
      name: 'footerNote',
      title: 'Footer line',
      type: 'string',
      group: 'navigation',
      initialValue: 'Maestro. Modern merchandising, responsible impact.',
    }),

    defineField({
      name: 'defaultSeo',
      title: 'SEO defaults',
      type: 'seo',
      group: 'seo',
      description: 'Used for any page that leaves its own SEO fields empty.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})

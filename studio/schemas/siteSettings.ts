import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Global settings: one document, edited in one place.
 *
 * Everything here is read by both pages, so a change to the WhatsApp number or
 * the enquiry address takes effect across the whole site without a deploy.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'brand', title: 'Logo And Favicon' },
    { name: 'general', title: 'General', default: true },
    { name: 'whatsapp', title: 'WhatsApp' },
    { name: 'contact', title: 'Contact' },
    { name: 'navigation', title: 'Navigation And Footer' },
    { name: 'seo', title: 'SEO Defaults' },
    { name: 'analytics', title: 'Analytics' },
  ],
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'brand',
      description:
        'Shown in the header and the footer. A PNG with a transparent background or an SVG, cropped close to the logo, looks sharpest. Left empty, the built-in Maestro wordmark is used.',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'brand',
      description:
        'The small icon in the browser tab, and on a phone home screen when the site is saved there. Use a square PNG or SVG of at least 512 x 512. Left empty, the built-in icon is used.',
    }),

    defineField({
      name: 'siteUrl',
      title: 'Production Site Address',
      type: 'url',
      group: 'general',
      description:
        'The live address, with https and no trailing slash, for example https://www.maestro.com. Canonical links and the sitemap are built from this.',
      validation: (rule) => rule.required(),
      initialValue: 'https://www.maestro.com',
    }),
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      group: 'general',
      initialValue: 'Maestro',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mastheadText',
      title: 'Masthead Line',
      type: 'string',
      group: 'general',
      description: 'The small centred line above the header.',
      initialValue: 'www.maestro.com',
    }),

    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
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
      title: 'Default WhatsApp Message',
      type: 'string',
      group: 'whatsapp',
      description: 'Pre-filled when someone taps a general WhatsApp button.',
      initialValue: 'Hello Maestro, I would like to ask about your merchandise.',
    }),
    defineField({
      name: 'whatsappProductMessage',
      title: 'Product WhatsApp Message',
      type: 'string',
      group: 'whatsapp',
      description:
        'Pre-filled from a product popup. Write {product} where the product name should appear.',
      initialValue: 'Hello Maestro, I would like to ask about {product}.',
    }),

    defineField({
      name: 'gaMeasurementId',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      group: 'analytics',
      description:
        'Looks like G-XXXXXXXXXX, from the data stream in your Google Analytics property. Left empty, the site loads no analytics script at all.',
      // Optional by design, so the check has to pass an empty value through.
      validation: (rule) =>
        rule.custom((value) =>
          !value || /^G-[A-Z0-9]{4,}$/i.test(value)
            ? true
            : 'A measurement id looks like G-XXXXXXXXXX',
        ),
    }),

    defineField({
      name: 'enquiryEmail',
      title: 'Enquiry E-Mail Address',
      type: 'string',
      group: 'contact',
      description:
        'Where the Get in touch form sends its enquiry. The visitor sends it from their own mail app, so this address is visible to them.',
      validation: (rule) => rule.required().email(),
      initialValue: 'hello@maestro.com',
    }),
    defineField({
      name: 'enquirySubject',
      title: 'Enquiry E-Mail Subject',
      type: 'string',
      group: 'contact',
      description: 'Write {name} where the visitor name should appear.',
      initialValue: 'Website enquiry from {name}',
    }),
    defineField({
      name: 'contact',
      title: 'Contact Details',
      type: 'object',
      group: 'contact',
      fields: [
        { name: 'address', type: 'string' },
        { name: 'email', title: 'Public E-Mail', type: 'string' },
        { name: 'phone', title: 'Public Phone', type: 'string' },
        { name: 'instagram', type: 'url' },
        { name: 'tiktok', type: 'url' },
        { name: 'mapsUrl', title: 'Google Maps URL', type: 'url' },
      ],
    }),

    defineField({
      name: 'navigation',
      title: 'Header Navigation',
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
      title: 'Footer Line',
      type: 'string',
      group: 'navigation',
      initialValue: 'Maestro. Modern merchandising, responsible impact.',
    }),

    defineField({
      name: 'defaultSeo',
      title: 'SEO Defaults',
      type: 'seo',
      group: 'seo',
      description: 'Used for any page that leaves its own SEO fields empty.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})

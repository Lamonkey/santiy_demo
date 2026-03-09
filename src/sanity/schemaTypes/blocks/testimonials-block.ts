import { defineArrayMember, defineField, defineType } from 'sanity'
import { UsersIcon, UserIcon } from '@sanity/icons'

export const testimonialItemType = defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'authorName', title: 'Author Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'authorTitle', title: 'Author Title / Company', type: 'string' }),
    defineField({
      name: 'authorImage',
      title: 'Author Photo',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: 'authorName', subtitle: 'quote', media: 'authorImage' },
  },
})

export const testimonialsBlockType = defineType({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'title', title: 'Section Title', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      of: [defineArrayMember({ type: 'testimonialItem' })],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Testimonials Section',
        subtitle: 'Testimonials Block',
        media: UsersIcon,
      }
    },
  },
})

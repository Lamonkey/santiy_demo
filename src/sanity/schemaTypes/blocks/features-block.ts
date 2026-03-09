import { defineArrayMember, defineField, defineType } from 'sanity'
import { ThListIcon, CheckmarkIcon } from '@sanity/icons'

export const featureItemType = defineType({
  name: 'featureItem',
  title: 'Feature Item',
  type: 'object',
  icon: CheckmarkIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    defineField({
      name: 'icon',
      title: 'Icon Name',
      description: 'Emoji or icon identifier',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
})

export const featuresBlockType = defineType({
  name: 'features',
  title: 'Features',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'items',
      title: 'Features',
      type: 'array',
      of: [defineArrayMember({ type: 'featureItem' })],
      validation: (rule) => rule.min(1).max(9),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      options: {
        list: [
          { title: '2 Columns', value: '2' },
          { title: '3 Columns', value: '3' },
          { title: '4 Columns', value: '4' },
        ],
        layout: 'radio',
      },
      initialValue: '3',
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Features Section',
        subtitle: 'Features Block',
        media: ThListIcon,
      }
    },
  },
})

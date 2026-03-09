import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

export const postType = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Metadata' },
    { name: 'translation', title: 'Translation' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Short summary for listings and SEO fallback',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) => rule.max(200).warning('Keep under 200 characters'),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt Text', validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({ name: 'href', type: 'url', title: 'URL' }),
                  defineField({ name: 'openInNewTab', type: 'boolean', title: 'Open in new tab', initialValue: false }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text', validation: (r) => r.required() }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'meta',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
      group: 'meta',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'meta',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Post',
      type: 'boolean',
      initialValue: false,
      group: 'meta',
    }),
    defineField({
      name: 'aiSummary',
      title: 'AI-Generated Summary',
      description: 'Auto-generated. Use the "Generate AI Summary" action.',
      type: 'text',
      rows: 3,
      group: 'meta',
      readOnly: true,
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      group: 'translation',
      initialValue: 'en',
      readOnly: true,
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Chinese (Simplified)', value: 'zh' },
        ],
      },
    }),
    defineField({
      name: 'translationOf',
      title: 'Translation Of',
      description: 'Points to the source document this was translated from',
      type: 'reference',
      to: [{ type: 'post' }],
      group: 'translation',
      readOnly: true,
    }),
    defineField({
      name: 'translationStatus',
      title: 'Translation Status',
      type: 'string',
      group: 'translation',
      initialValue: 'none',
      readOnly: true,
      options: {
        list: [
          { title: 'N/A', value: 'none' },
          { title: 'Pending Review', value: 'pending_review' },
          { title: 'Approved', value: 'approved' },
        ],
      },
    }),
    defineField({
      name: 'syncStatus',
      title: 'Sync Status',
      description: 'Set by the cron job — flags when this document is newer than its translation pair.',
      type: 'string',
      group: 'translation',
      initialValue: 'synced',
      readOnly: true,
      options: {
        list: [
          { title: 'Synced', value: 'synced' },
          { title: 'Out of sync', value: 'out_of_sync' },
        ],
      },
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      language: 'language',
      translationStatus: 'translationStatus',
      syncStatus: 'syncStatus',
    },
    prepare({ title, author, media, language, translationStatus, syncStatus }) {
      const lang = language && language !== 'en' ? ` [${language.toUpperCase()}]` : ''
      const pending = translationStatus === 'pending_review' ? ' ⏳' : ''
      const outOfSync = syncStatus === 'out_of_sync' ? ' 🔄' : ''
      return {
        title: `${title}${lang}${pending}${outOfSync}`,
        subtitle: author ? `by ${author}` : 'No author',
        media: media ?? DocumentTextIcon,
      }
    },
  },
})

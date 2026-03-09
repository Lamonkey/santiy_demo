import { defineBlueprint, defineDocumentFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'ai-blog-review',
      title: 'AI Blog Draft Review',
      description: 'Reviews blog post drafts and provides feedback before publishing',
      type: 'document.action',
      trigger: {
        on: 'unpublish',
        documentTypes: ['post'],
      },
    }),
  ],
})

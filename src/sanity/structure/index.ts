import type { StructureResolver } from 'sanity/structure'
import {
  CogIcon,
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
} from '@sanity/icons'

const SINGLETONS = ['settings', 'landingPage', 'landingPageZh']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singletons
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(S.document().schemaType('settings').documentId('settings')),

      S.listItem()
        .title('Landing Page')
        .icon(HomeIcon)
        .child(S.document().schemaType('landingPage').documentId('landingPage')),

      S.listItem()
        .title('Landing Page (Chinese)')
        .icon(HomeIcon)
        .child(S.document().schemaType('landingPage').documentId('landingPageZh')),

      S.divider(),

      // Blog
      S.listItem()
        .title('Blog')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('post').title('Posts').icon(DocumentTextIcon),
              S.documentTypeListItem('author').title('Authors').icon(UserIcon),
              S.documentTypeListItem('category').title('Categories').icon(TagIcon),
            ])
        ),

      S.divider(),

      // All other document types (filtered)
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETONS.includes(item.getId() as string) &&
          !['post', 'author', 'category'].includes(item.getId() as string)
      ),
    ])

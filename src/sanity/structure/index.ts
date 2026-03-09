import type { StructureResolver } from 'sanity/structure'
import {
  CogIcon,
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  ProjectsIcon,
} from '@sanity/icons'

const SINGLETONS = ['settings', 'landingPage']

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

      // Case Studies
      S.documentTypeListItem('caseStudy').title('Case Studies').icon(ProjectsIcon),

      S.divider(),

      // All other document types (filtered)
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETONS.includes(item.getId() as string) &&
          !['post', 'author', 'category', 'caseStudy'].includes(item.getId() as string)
      ),
    ])

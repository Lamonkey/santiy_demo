import { useState } from 'react'
import { useClient } from 'sanity'
import { useToast } from '@sanity/ui'
import type { DocumentActionProps } from 'sanity'

function extractPageBuilderText(doc: any): string {
  const parts: string[] = []
  for (const block of doc?.pageBuilder ?? []) {
    if (block.headline) parts.push(block.headline)
    if (block.subheadline) parts.push(block.subheadline)
    if (block.title) parts.push(block.title)
    if (block.subtitle) parts.push(block.subtitle)
    for (const item of block.items ?? []) {
      if (item.title) parts.push(item.title)
      if (item.description) parts.push(item.description)
    }
  }
  return parts.join(' ')
}

function extractPostText(doc: any): string {
  if (!doc?.body || !Array.isArray(doc.body)) return ''
  return doc.body
    .filter((b: any) => b._type === 'block')
    .map((b: any) => b.children?.map((c: any) => c.text).join('') ?? '')
    .join(' ')
}

export function GenerateSeoAction(props: DocumentActionProps) {
  const { id, type, draft, published } = props
  const client = useClient({ apiVersion: '2026-02-01' })
  const toast = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  if (!['post', 'landingPage'].includes(type)) return null

  const doc = (draft ?? published) as Record<string, any> | null
  const hasSeo = doc?.seo?.title || doc?.seo?.description

  return {
    label: isGenerating ? 'Generating…' : hasSeo ? 'Regenerate SEO' : 'Generate SEO',
    disabled: isGenerating,
    onHandle: async () => {
      setIsGenerating(true)
      toast.push({ status: 'info', title: 'Generating SEO…', description: 'Reading document content and calling GPT-4o.' })
      try {
        const bodyText = type === 'landingPage'
          ? extractPageBuilderText(doc)
          : extractPostText(doc)

        const res = await fetch('/api/ai-seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: doc?.title ?? '',
            excerpt: doc?.excerpt ?? '',
            body: bodyText,
          }),
        })
        const { title, description } = await res.json()

        const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`
        const publishedId = draftId.replace(/^drafts\./, '')

        const base = (await client.getDocument(draftId)) ?? (await client.getDocument(publishedId))
        const tx = client.transaction()
        tx.createIfNotExists({ ...(base ?? {}), _id: draftId, _type: type })
        tx.patch(draftId, { setIfMissing: { seo: {} }, set: { 'seo.title': title, 'seo.description': description } })

        if (type === 'landingPage') {
          const settingsDraftId = 'drafts.settings'
          const settingsBase = (await client.getDocument(settingsDraftId)) ?? (await client.getDocument('settings'))
          tx.createIfNotExists({ ...(settingsBase ?? {}), _id: settingsDraftId, _type: 'settings' })
          tx.patch(settingsDraftId, {
            setIfMissing: { seo: {} },
            set: { 'seo.title': title, 'seo.description': description },
          })
        }

        await tx.commit({ visibility: 'async' })

        toast.push({
          status: 'success',
          title: 'SEO fields updated',
          description: type === 'landingPage'
            ? 'Landing page and site settings SEO have been updated in this draft.'
            : 'SEO title and description written to draft.',
        })
        props.onComplete()
      } catch (err) {
        console.error(err)
        toast.push({ status: 'error', title: 'SEO generation failed', description: 'Check the browser console for details.' })
      } finally {
        setIsGenerating(false)
      }
    },
  }
}

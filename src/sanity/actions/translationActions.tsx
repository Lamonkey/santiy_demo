import { useState } from 'react'
import { useClient, useDocumentOperation } from 'sanity'
import { useToast } from '@sanity/ui'
import type { DocumentActionProps } from 'sanity'

// ── Approve Translation ────────────────────────────────────────────────────
export function ApproveTranslationAction(props: DocumentActionProps) {
  const { id, type, draft, published } = props
  const client = useClient({ apiVersion: '2026-02-01' })
  const toast = useToast()
  const { publish } = useDocumentOperation(id, type)
  const [isApproving, setIsApproving] = useState(false)

  const doc = draft ?? published
  if (type !== 'post' || doc?.translationStatus !== 'pending_review') return null

  return {
    label: isApproving ? 'Approving…' : 'Approve Translation',
    disabled: isApproving || publish.disabled !== false,
    tone: 'positive' as const,
    onHandle: async () => {
      setIsApproving(true)
      toast.push({ status: 'info', title: 'Approving translation…' })
      try {
        publish.execute()
        const cleanId = id.replace(/^drafts\./, '')
        await client
          .patch(cleanId)
          .set({ translationStatus: 'approved' })
          .commit({ visibility: 'async' })
        toast.push({ status: 'success', title: 'Translation approved', description: 'The post has been published and marked as approved.' })
        props.onComplete()
      } catch (err) {
        console.error(err)
        toast.push({ status: 'error', title: 'Approval failed', description: 'Check the browser console for details.' })
      } finally {
        setIsApproving(false)
      }
    },
  }
}

// ── Re-translate ───────────────────────────────────────────────────────────
export function RetranslateAction(props: DocumentActionProps) {
  const { id, type, draft, published } = props
  const toast = useToast()
  const [isTranslating, setIsTranslating] = useState(false)

  const doc = published ?? draft
  if (type !== 'post' || !doc) return null

  const cleanId = id.replace(/^drafts\./, '')
  const targetLocale = doc.language === 'en' ? 'ZH' : 'EN'

  return {
    label: isTranslating ? 'Translating…' : `Re-translate → ${targetLocale}`,
    disabled: isTranslating,
    onHandle: async () => {
      setIsTranslating(true)
      toast.push({ status: 'info', title: `Translating to ${targetLocale}…`, description: 'Sending content to GPT-4o, this may take a few seconds.' })
      try {
        const res = await fetch('/api/posts/create', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: cleanId }),
        })
        if (!res.ok) throw new Error('Translation failed')
        toast.push({ status: 'success', title: 'Translation queued', description: `A ${targetLocale} draft has been created and is pending review.` })
        props.onComplete()
      } catch (err) {
        console.error(err)
        toast.push({ status: 'error', title: 'Translation failed', description: 'Check the browser console or API logs for details.' })
      } finally {
        setIsTranslating(false)
      }
    },
  }
}

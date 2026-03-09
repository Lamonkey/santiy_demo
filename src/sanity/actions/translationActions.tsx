import { useState } from 'react'
import { useClient, useDocumentOperation } from 'sanity'
import type { DocumentActionProps } from 'sanity'

// ── Approve Translation ────────────────────────────────────────────────────
// Shows on any post with translationStatus === 'pending_review'
// Publishes the draft and marks it approved.
export function ApproveTranslationAction(props: DocumentActionProps) {
  const { id, type, draft, published } = props
  const client = useClient({ apiVersion: '2026-02-01' })
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
      try {
        // Publish the draft
        publish.execute()
        // Mark as approved on the published document
        const cleanId = id.replace(/^drafts\./, '')
        await client
          .patch(cleanId)
          .set({ translationStatus: 'approved' })
          .commit({ visibility: 'async' })
        props.onComplete()
      } finally {
        setIsApproving(false)
      }
    },
  }
}

// ── Re-translate ───────────────────────────────────────────────────────────
// Shows on any published post. Translates the current document content to
// the other language and creates/updates that document as a pending draft.
export function RetranslateAction(props: DocumentActionProps) {
  const { id, type, draft, published } = props
  const [isTranslating, setIsTranslating] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const doc = published ?? draft
  if (type !== 'post' || !doc) return null

  const cleanId = id.replace(/^drafts\./, '')
  const targetLocale = doc.language === 'en' ? 'ZH' : 'EN'

  return {
    label: isDone
      ? 'Translation queued ✓'
      : isTranslating
        ? 'Translating…'
        : `Re-translate → ${targetLocale}`,
    disabled: isTranslating || isDone,
    onHandle: async () => {
      setIsTranslating(true)
      try {
        const res = await fetch('/api/posts/create', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: cleanId }),
        })
        if (!res.ok) throw new Error('Translation failed')
        setIsDone(true)
        setTimeout(() => {
          setIsDone(false)
          props.onComplete()
        }, 2500)
      } catch (err) {
        console.error(err)
      } finally {
        setIsTranslating(false)
      }
    },
  }
}

import { useState } from 'react'
import { useToast } from '@sanity/ui'
import type { DocumentActionProps } from 'sanity'

export function TranslateLandingPageAction(props: DocumentActionProps) {
  const { type, draft, published } = props
  const toast = useToast()
  const [isTranslating, setIsTranslating] = useState(false)

  if (type !== 'landingPage') return null

  const doc = draft ?? published
  if (!doc) return null

  return {
    label: isTranslating ? 'Translating…' : 'Translate to Chinese',
    disabled: isTranslating,
    onHandle: async () => {
      setIsTranslating(true)
      toast.push({ status: 'info', title: 'Translating landing page…', description: 'Sending content to GPT-4o, this may take a few seconds.' })
      try {
        const res = await fetch('/api/landing-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: doc }),
        })
        if (!res.ok) throw new Error('Translation failed')
        toast.push({ status: 'success', title: 'Translation complete', description: 'Chinese landing page has been created in Sanity.' })
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

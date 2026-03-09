'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

type Improvement = { area: string; suggestion: string }

type ReviewFeedback = {
  score: number
  summary: string
  strengths: string[]
  improvements: Improvement[]
  seoTips: string[]
  readability: string
  verdict: string
  raw?: string
}

type Status = 'idle' | 'reviewing' | 'submitting' | 'submitted' | 'error'

const verdictColor: Record<string, string> = {
  'Ready to submit': 'text-green-600 bg-green-50 border-green-200',
  'Needs minor edits': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'Needs major revision': 'text-red-600 bg-red-50 border-red-200',
}

const scoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-500'
}

export default function WritePage() {
  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const contentForReview = `Title: ${title}\n\nExcerpt: ${excerpt}\n\n${body}`
  const canReview = title.trim().length > 0 && body.trim().length > 100
  const canSubmit = authorName.trim().length > 0 && title.trim().length > 0 && body.trim().length > 100

  async function handleReview() {
    setStatus('reviewing')
    setFeedback(null)
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentForReview, type: 'review' }),
      })
      const data = await res.json()
      setFeedback(data)
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorMsg('AI review failed. Please try again.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('authorName', authorName)
      formData.append('title', title)
      formData.append('excerpt', excerpt)
      formData.append('body', body)
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch('/api/posts/create', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Submission failed')
      setStatus('submitted')
    } catch {
      setStatus('error')
      setErrorMsg('Failed to submit. Please try again.')
    }
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-3">Article Published!</h1>
          <p className="text-gray-600 mb-6">
            Your article is now live. Head over to the blog to see it.
          </p>
          <button
            onClick={() => {
              setAuthorName(''); setTitle(''); setExcerpt(''); setBody('')
              setImageFile(null); setImagePreview(null); setFeedback(null); setStatus('idle')
            }}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Write Another Article
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Write an Article</h1>
          <p className="mt-2 text-gray-500">
            Share your knowledge. Use the AI review tool to refine your draft before submitting.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">

          {/* Author name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is your article about?"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg font-medium"
            />
            <p className="mt-1 text-xs text-gray-400">{title.length}/100 characters</p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover Image
              <span className="ml-2 text-xs font-normal text-gray-400">optional</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={imagePreview}
                  alt="Cover preview"
                  width={800}
                  height={400}
                  className="w-full object-cover max-h-56"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-white text-gray-600 hover:text-red-500 rounded-full p-1.5 shadow transition"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                <span className="text-2xl mb-1">🖼️</span>
                <span className="text-sm text-gray-500">Click to upload an image</span>
                <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP up to 10MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Short Summary
              <span className="ml-2 text-xs font-normal text-gray-400">optional but recommended</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A one or two sentence summary that will appear in listings and search results..."
              rows={2}
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">{excerpt.length}/200 characters</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Article Body <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your article here. Separate paragraphs with a blank line.&#10;&#10;Aim for at least 300 words for a quality article."
              rows={18}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y font-mono text-sm leading-relaxed"
            />
            <p className="mt-1 text-xs text-gray-400">
              {body.trim().split(/\s+/).filter(Boolean).length} words
              {body.trim().length < 100 && (
                <span className="ml-2 text-amber-500">Write at least ~100 characters to enable review</span>
              )}
            </p>
          </div>

          {/* Error */}
          {status === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {errorMsg}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleReview}
              disabled={!canReview || status === 'reviewing'}
              className="flex-1 px-5 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'reviewing' ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  Reviewing…
                </>
              ) : (
                <>✨ Get AI Feedback</>
              )}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || status === 'submitting' || status === 'reviewing'}
              className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting…
                </>
              ) : (
                '→ Publish Article'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Your article will be published immediately and appear on the blog.
          </p>
        </form>

        {/* ── AI Feedback Panel ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            {!feedback && status !== 'reviewing' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm font-medium text-gray-500">AI Review</p>
                <p className="text-sm mt-1">
                  Write your article, then click <strong className="text-gray-600">"Get AI Feedback"</strong> to get editorial suggestions before submitting.
                </p>
              </div>
            )}

            {status === 'reviewing' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
                <p className="text-sm text-gray-500">Analysing your draft…</p>
              </div>
            )}

            {feedback && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Score header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">AI Score</p>
                    <p className={`text-4xl font-bold mt-0.5 ${scoreColor(feedback.score)}`}>
                      {feedback.score}<span className="text-base text-gray-300">/10</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Readability</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{feedback.readability}</p>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-5">
                  {/* Verdict */}
                  {feedback.verdict && (
                    <p className={`text-sm font-medium px-3 py-2 rounded-lg border ${verdictColor[feedback.verdict] ?? 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                      {feedback.verdict}
                    </p>
                  )}

                  {/* Summary */}
                  <p className="text-sm text-gray-600">{feedback.summary}</p>

                  {/* Strengths */}
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Suggestions</p>
                      <ul className="space-y-3">
                        {feedback.improvements.map((item, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium text-gray-700">{item.area}</p>
                            <p className="text-gray-500 mt-0.5">{item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* SEO Tips */}
                  {feedback.seoTips?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">SEO Tips</p>
                      <ul className="space-y-1">
                        {feedback.seoTips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-600">
                            <span className="text-blue-400 mt-0.5">→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Raw fallback */}
                  {feedback.raw && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{feedback.raw}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={status === 'reviewing'}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 transition"
                  >
                    ↻ Re-review after edits
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

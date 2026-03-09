'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import FieldToolbar from '@/components/FieldToolbar'

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error'

export default function WritePage() {
  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSubmit = authorName.trim().length > 0 && title.trim().length > 0 && body.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('authorName', authorName)
      fd.append('title', title)
      fd.append('excerpt', excerpt)
      fd.append('body', body)
      if (imageFile) fd.append('image', imageFile)
      const res = await fetch('/api/posts/create', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setSubmitStatus('submitted')
    } catch {
      setSubmitStatus('error')
      setSubmitError('Failed to submit. Please try again.')
    }
  }

  if (submitStatus === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-3">Article Published!</h1>
          <p className="text-gray-600 mb-6">Your article is now live. Head over to the blog to see it.</p>
          <div className="flex gap-3 justify-center">
          <a
            href="/blog"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Blog
          </a>
          <button
            onClick={() => {
              setAuthorName(''); setTitle(''); setExcerpt(''); setBody('')
              setImageFile(null); setImagePreview(null); setSubmitStatus('idle')
            }}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Write Another Article
          </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Write an Article</h1>
          <p className="mt-2 text-gray-500">
            Use the <span className="inline-flex items-center gap-1 text-gray-600 font-medium">🎤 mic</span> to dictate
            or <span className="inline-flex items-center gap-1 text-gray-600 font-medium">✨ polish</span> to edit with AI — available on any text field.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-7">

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
              placeholder="A one or two sentence summary..."
              rows={2}
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
            <div className="flex items-start justify-between mt-1">
              <p className="text-xs text-gray-400">{excerpt.length}/200 characters</p>
              <FieldToolbar value={excerpt} onChange={setExcerpt} />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Article Body <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Write your article here.\n\nSeparate paragraphs with a blank line. Use the mic to dictate or ✨ to polish with AI."}
              rows={20}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y font-mono text-sm leading-relaxed"
            />
            <div className="flex items-start justify-between mt-1">
              <p className="text-xs text-gray-400">
                {body.trim().split(/\s+/).filter(Boolean).length} words
              </p>
              <FieldToolbar value={body} onChange={setBody} />
            </div>
          </div>

          {/* Error */}
          {submitStatus === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {submitError}
            </p>
          )}

          {/* Publish */}
          <button
            type="submit"
            disabled={!canSubmit || submitStatus === 'submitting'}
            className="w-full px-5 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitStatus === 'submitting' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : '→ Publish Article'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Your article will be published immediately and appear on the blog.
          </p>
        </form>
      </div>
    </div>
  )
}

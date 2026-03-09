'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

type EditStatus = 'idle' | 'editing' | 'done' | 'error'
type RecordStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error'

export default function WritePage() {
  // Form fields
  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Submit
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState('')

  // Voice recording
  const [recordStatus, setRecordStatus] = useState<RecordStatus>('idle')
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcribeError, setTranscribeError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // AI editing
  const [editInstruction, setEditInstruction] = useState('')
  const [editStatus, setEditStatus] = useState<EditStatus>('idle')
  const [editSuggestion, setEditSuggestion] = useState('')
  const [editError, setEditError] = useState('')

  // Image
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [audioUrl, imagePreview])

  // ── Image ────────────────────────────────────────────────────────────────
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

  // ── Voice recording ──────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecordSeconds(0)
      setAudioUrl(null)
      setAudioBlob(null)
      setTranscribeError('')
      setRecordStatus('recording')
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      setTranscribeError('Microphone access denied.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecordStatus('idle')
  }

  async function transcribeAudio() {
    if (!audioBlob) return
    setRecordStatus('transcribing')
    setTranscribeError('')
    try {
      const fd = new FormData()
      fd.append('audio', audioBlob, 'recording.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Transcription failed')
      setBody((prev) => prev ? `${prev}\n\n${data.text}` : data.text)
      setRecordStatus('done')
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Transcription failed. Your recording is still saved below.')
      setRecordStatus('error')
    }
  }

  function downloadRecording() {
    if (!audioBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(audioBlob)
    a.download = 'recording.webm'
    a.click()
  }

  const recordingTime = `${String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:${String(recordSeconds % 60).padStart(2, '0')}`

  // ── AI editing ───────────────────────────────────────────────────────────
  async function handleEdit() {
    if (!editInstruction.trim() || !body.trim()) return
    setEditStatus('editing')
    setEditSuggestion('')
    setEditError('')
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body, instruction: editInstruction, type: 'edit' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setEditSuggestion(data.text)
      setEditStatus('done')
    } catch {
      setEditError('Edit failed. Please try again.')
      setEditStatus('error')
    }
  }

  function acceptEdit() {
    setBody(editSuggestion)
    setEditSuggestion('')
    setEditInstruction('')
    setEditStatus('idle')
  }

  function discardEdit() {
    setEditSuggestion('')
    setEditStatus('idle')
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const canSubmit = authorName.trim().length > 0 && title.trim().length > 0 && body.trim().length > 100

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
      if (!res.ok) throw new Error('Submission failed')
      setSubmitStatus('submitted')
    } catch {
      setSubmitStatus('error')
      setSubmitError('Failed to submit. Please try again.')
    }
  }

  // ── Submitted screen ─────────────────────────────────────────────────────
  if (submitStatus === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-3">Article Published!</h1>
          <p className="text-gray-600 mb-6">Your article is now live. Head over to the blog to see it.</p>
          <button
            onClick={() => {
              setAuthorName(''); setTitle(''); setExcerpt(''); setBody('')
              setImageFile(null); setImagePreview(null)
              setAudioUrl(null); setAudioBlob(null); setRecordStatus('idle')
              setEditInstruction(''); setEditSuggestion(''); setEditStatus('idle')
              setSubmitStatus('idle')
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
            Dictate with your voice, then refine with AI editing assistance before publishing.
          </p>
        </div>
      </div>

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
              placeholder="A one or two sentence summary..."
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
              placeholder={"Write your article here, or use the voice recorder below.\n\nSeparate paragraphs with a blank line."}
              rows={18}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y font-mono text-sm leading-relaxed"
            />
            <p className="mt-1 text-xs text-gray-400">
              {body.trim().split(/\s+/).filter(Boolean).length} words
              {body.trim().length < 100 && (
                <span className="ml-2 text-amber-500">Write at least ~100 characters to publish</span>
              )}
            </p>
          </div>

          {/* ── Voice Recorder ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Voice Input</p>
                <p className="text-xs text-gray-400 mt-0.5">Record your thoughts — transcription appends to the body above</p>
              </div>
              {recordStatus === 'recording' && (
                <span className="flex items-center gap-1.5 text-sm font-mono text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {recordingTime}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {recordStatus === 'recording' ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                >
                  <span className="w-3 h-3 rounded-sm bg-white" />
                  Stop Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={recordStatus === 'transcribing'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  {audioBlob ? 'Record Again' : 'Start Recording'}
                </button>
              )}

              {audioBlob && recordStatus !== 'recording' && (
                <button
                  type="button"
                  onClick={transcribeAudio}
                  disabled={recordStatus === 'transcribing'}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {recordStatus === 'transcribing' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Transcribing…
                    </>
                  ) : 'Transcribe'}
                </button>
              )}
            </div>

            {/* Audio player + download — retained even after transcription */}
            {audioUrl && recordStatus !== 'recording' && (
              <div className="space-y-2">
                <audio controls src={audioUrl} className="w-full h-9 rounded" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Recording retained — download it if transcription was incorrect.
                  </p>
                  <button
                    type="button"
                    onClick={downloadRecording}
                    className="text-xs text-blue-600 hover:text-blue-800 transition"
                  >
                    Download recording
                  </button>
                </div>
              </div>
            )}

            {recordStatus === 'done' && (
              <p className="text-xs text-green-600">Transcription added to article body.</p>
            )}
            {transcribeError && (
              <p className="text-xs text-red-500">{transcribeError}</p>
            )}
          </div>

          {/* Submit error */}
          {submitStatus === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {submitError}
            </p>
          )}

          {/* Publish */}
          <div className="pt-2">
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
          </div>

          <p className="text-xs text-gray-400">
            Your article will be published immediately and appear on the blog.
          </p>
        </form>

        {/* ── AI Editing Assistant ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">AI Editing Assistant</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Tell the AI what to do with your article — it rewrites, you decide.
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              <textarea
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder={'What should I edit?\n\ne.g. "Fix grammar and improve flow"\n"Make this more concise"\n"Add a stronger conclusion"\n"Rewrite in a friendlier tone"'}
                rows={5}
                disabled={editStatus === 'editing'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none bg-white disabled:opacity-50"
              />

              <button
                type="button"
                onClick={handleEdit}
                disabled={!editInstruction.trim() || !body.trim() || editStatus === 'editing'}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editStatus === 'editing' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Editing…
                  </>
                ) : 'Apply Edit'}
              </button>

              {editError && (
                <p className="text-xs text-red-500">{editError}</p>
              )}
            </div>

            {/* Suggestion preview */}
            {editStatus === 'done' && editSuggestion && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Suggested Edit</p>
                <textarea
                  readOnly
                  value={editSuggestion}
                  rows={12}
                  className="w-full px-3 py-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm font-mono leading-relaxed resize-none focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptEdit}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Accept Changes
                  </button>
                  <button
                    type="button"
                    onClick={discardEdit}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {editStatus === 'idle' && (
              <div className="px-5 pb-5">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Example instructions</p>
                  {[
                    'Fix grammar and improve flow',
                    'Make this 30% shorter',
                    'Add a stronger introduction',
                    'Rewrite in a friendlier tone',
                    'Add subheadings to structure this',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setEditInstruction(example)}
                      className="block w-full text-left text-xs text-gray-500 hover:text-blue-600 hover:bg-white px-2 py-1.5 rounded transition"
                    >
                      → {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

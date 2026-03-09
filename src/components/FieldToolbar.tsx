'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
}

function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M5 3l.5 2L7 5.5 5.5 6 5 8l-.5-2L3 5.5 4.5 5 5 3z" />
      <path d="M19 15l.5 2 1.5.5-1.5.5-.5 2-.5-2-1.5-.5 1.5-.5.5-2z" />
    </svg>
  )
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
  )
}

export default function FieldToolbar({ value, onChange }: Props) {
  // ── Recording ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null)
  const [recordError, setRecordError] = useState('')
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // ── Polish menu ────────────────────────────────────────────────────────
  const [showMenu, setShowMenu] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Custom panel — persists until closed ──────────────────────────────
  const [showCustom, setShowCustom] = useState(false)
  const [customInstruction, setCustomInstruction] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [customError, setCustomError] = useState('')

  // Close polish menu on outside click
  useEffect(() => {
    if (!showMenu) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  // ── Voice recording ────────────────────────────────────────────────────
  async function toggleRecord() {
    if (isRecording) {
      mrRef.current?.stop()
      return
    }
    setRecordError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setSavedBlob(blob)
        setIsRecording(false)
        setIsTranscribing(true)
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok || data.error) throw new Error(data.error ?? 'Failed')
          onChange(value ? `${value}\n\n${data.text}` : data.text)
        } catch {
          setRecordError('Transcription failed — recording saved.')
        } finally {
          setIsTranscribing(false)
        }
      }
      mr.start()
      mrRef.current = mr
      setIsRecording(true)
    } catch {
      setRecordError('Microphone access denied.')
    }
  }

  function downloadRecording() {
    if (!savedBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(savedBlob)
    a.download = 'recording.webm'
    a.click()
  }

  // ── Polish ─────────────────────────────────────────────────────────────
  async function applyPolish(instruction: string) {
    if (!value.trim()) return
    setIsPolishing(true)
    setShowMenu(false)
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value, instruction, type: 'edit' }),
      })
      const data = await res.json()
      if (data.text) onChange(data.text)
    } finally {
      setIsPolishing(false)
    }
  }

  // ── Custom edit ────────────────────────────────────────────────────────
  async function applyCustom() {
    if (!customInstruction.trim() || !value.trim()) return
    setIsApplying(true)
    setCustomError('')
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value, instruction: customInstruction, type: 'edit' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      if (data.text) onChange(data.text)
      // Keep instruction so user can refine and re-apply
    } catch {
      setCustomError('Edit failed. Try again.')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="relative">
      {/* Icon buttons */}
      <div className="flex items-center gap-0.5">
        {/* Microphone */}
        <button
          type="button"
          onClick={toggleRecord}
          disabled={isTranscribing}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          className={`p-1.5 rounded-md transition-colors ${
            isRecording
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isTranscribing ? <Spinner /> : isRecording ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <MicIcon />
            </span>
          ) : <MicIcon />}
        </button>

        {/* Polish */}
        <button
          type="button"
          onClick={() => { setShowMenu((v) => !v); setShowCustom(false) }}
          disabled={isPolishing || !value.trim()}
          title="AI polish"
          className={`p-1.5 rounded-md transition-colors ${
            showMenu || showCustom
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isPolishing ? <Spinner /> : <SparklesIcon />}
        </button>
      </div>

      {/* Polish menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 bottom-9 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-44 text-sm"
        >
          <button
            type="button"
            onClick={() => applyPolish('Make this more concise without losing key information')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Make it concise
          </button>
          <button
            type="button"
            onClick={() => applyPolish('Fix all grammar, spelling, and punctuation errors')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Fix grammar
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={() => { setShowMenu(false); setShowCustom(true) }}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 transition-colors"
          >
            Customized…
          </button>
        </div>
      )}

      {/* Custom floating panel — stays open until × */}
      {showCustom && (
        <div className="absolute right-0 bottom-9 z-30 w-72 bg-white border border-gray-200 rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">AI Editor</span>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) applyCustom()
              }}
              placeholder={'How should I edit this?\n\ne.g. "Add a stronger conclusion"\n"Rewrite in a formal tone"'}
              rows={4}
              disabled={isApplying}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
            />
            {customError && <p className="text-xs text-red-500">{customError}</p>}
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customInstruction.trim() || isApplying}
              className="w-full px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <><Spinner /> Applying…</>
              ) : (
                <>Apply <span className="opacity-50 text-xs font-normal">⌘↵</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status line */}
      {(isTranscribing || recordError) && (
        <div className="mt-1">
          {isTranscribing && <p className="text-xs text-blue-500">Transcribing…</p>}
          {recordError && (
            <p className="text-xs text-red-500">
              {recordError}
              {savedBlob && (
                <button
                  type="button"
                  onClick={downloadRecording}
                  className="ml-1.5 underline hover:text-red-700 transition-colors"
                >
                  Download recording
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { set, TextInputProps } from 'sanity'

export function AiTextAreaInput(props: TextInputProps) {
  const { value, onChange, renderDefault } = props
  const [instruction, setInstruction] = useState('')
  const [isPolishing, setIsPolishing] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      blobRef.current = blob
      setIsTranscribing(true)
      try {
        const fd = new FormData()
        fd.append('audio', blob, 'recording.webm')
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
        const { text } = await res.json()
        onChange(set((value ? value + ' ' : '') + text))
      } finally {
        setIsTranscribing(false)
      }
    }
    recorder.start()
    mediaRef.current = recorder
    setIsRecording(true)
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setIsRecording(false)
  }

  async function polish() {
    if (!value || !instruction.trim()) return
    setIsPolishing(true)
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value, instruction, mode: 'edit' }),
      })
      const data = await res.json()
      onChange(set(data.result ?? data.content ?? value))
      setInstruction('')
      setShowInput(false)
    } finally {
      setIsPolishing(false)
    }
  }

  return (
    <div>
      {renderDefault(props)}
      <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            fontSize: 11,
            padding: '2px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: isRecording ? '#fee2e2' : 'white',
            cursor: 'pointer',
            color: isRecording ? '#dc2626' : '#555',
          }}
        >
          {isRecording ? '⏹ Stop' : isTranscribing ? '…' : '🎙 Record'}
        </button>
        <button
          type="button"
          onClick={() => setShowInput((v) => !v)}
          style={{
            fontSize: 11,
            padding: '2px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: 'white',
            cursor: 'pointer',
            color: '#555',
          }}
        >
          ✨ Polish
        </button>
      </div>
      {showInput && (
        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Instruction e.g. fix grammar"
            onKeyDown={(e) => { if (e.key === 'Enter') polish() }}
            style={{
              flex: 1,
              fontSize: 12,
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          />
          <button
            type="button"
            onClick={polish}
            disabled={isPolishing}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              background: '#1a1a2e',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {isPolishing ? '…' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  )
}

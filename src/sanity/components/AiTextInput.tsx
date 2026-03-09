'use client'

import { useState } from 'react'
import { set, StringInputProps } from 'sanity'

export function AiTextInput(props: StringInputProps) {
  const { value, onChange, renderDefault } = props
  const [instruction, setInstruction] = useState('')
  const [isPolishing, setIsPolishing] = useState(false)
  const [showInput, setShowInput] = useState(false)

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
            placeholder="Instruction e.g. make it more concise"
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

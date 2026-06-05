import { useState, useEffect, useRef } from 'react'
import { MAX_COMPOSER_CHARS } from '@shared/limits'

const DEBOUNCE_MS = 400
const MIN_LEN = 10

// status: 'idle' | 'pending' | 'loading' | 'done' | 'error'
export function useGemini(text, enabled = true) {
  const [status, setStatus]   = useState('idle')
  const [result, setResult]   = useState(null)
  const [error,  setError]    = useState(null)
  const timerRef              = useRef(null)
  const latestText            = useRef(text)

  useEffect(() => {
    latestText.current = text
  }, [text])

  useEffect(() => {
    clearTimeout(timerRef.current)

    if (!enabled || !text || text.trim().length < MIN_LEN) {
      setStatus('idle')
      setResult(null)
      setError(null)
      return
    }

    if (text.length >= MAX_COMPOSER_CHARS) {
      setStatus('error')
      setResult(null)
      setError(null)
      return
    }

    setStatus('pending')

    timerRef.current = setTimeout(async () => {
      // Guard: if text changed during debounce, ignore
      if (latestText.current !== text) return

      setStatus('loading')
      setError(null)

      try {
        const data = await window.api.parseWithGemini(text)
        if (latestText.current !== text) return
        setResult(data)
        setStatus('done')
      } catch (err) {
        if (latestText.current !== text) return
        setError(err.message ?? 'Parse failed')
        setStatus('error')
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timerRef.current)
  }, [text, enabled])

  return { status, result, error }
}

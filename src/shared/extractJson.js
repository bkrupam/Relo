/** Extract first balanced JSON array or object from model text (non-greedy). */
export function extractJsonPayload(textPart) {
  if (!textPart || typeof textPart !== 'string') return null

  const startArr = textPart.indexOf('[')
  const startObj = textPart.indexOf('{')
  let start = -1
  let open = ''
  let close = ''

  if (startArr === -1 && startObj === -1) return null
  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    start = startArr
    open = '['
    close = ']'
  } else {
    start = startObj
    open = '{'
    close = '}'
  }

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < textPart.length; i++) {
    const ch = textPart[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return textPart.slice(start, i + 1)
    }
  }

  return null
}

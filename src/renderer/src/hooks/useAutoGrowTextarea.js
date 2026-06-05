import { useLayoutEffect } from 'react'

/** ~6 lines at text-sm / leading-relaxed — then scroll inside the field */
export const COMPOSER_TEXTAREA_MAX_PX = 132

export function useAutoGrowTextarea(ref, value, maxHeight = COMPOSER_TEXTAREA_MAX_PX) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [ref, value, maxHeight])
}

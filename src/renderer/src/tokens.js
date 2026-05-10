// Design tokens — Remindly v4 · Sequoia Utility Design System
export const T = {
  // ── Glass surfaces ───────────────────────────────────────────────────────────
  // Popovers: Dark semi-transparent fill (80% opacity) with 30px backdrop blur
  popoverBg:        'rgba(16, 19, 27, 0.80)', // based on #10131b
  cardFill:         'rgba(28, 32, 40, 0.60)', // based on #1c2028 (surface-container)
  cardFillHover:    'rgba(49, 53, 61, 0.70)', // based on #31353d (surface-variant)
  cardFillStrong:   'rgba(54, 57, 66, 0.80)', // based on #363942 (surface-bright)
  
  // Thin 1px strokes using semi-transparent variations of the neutral palette (#747781)
  cardBorder:       'rgba(116, 119, 129, 0.20)', 
  cardInset:        'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
  
  fieldFill:        'rgba(49, 53, 61, 0.40)', // based on #31353d (surface-container-highest) for high contrast
  fieldBorder:      'rgba(116, 119, 129, 0.40)', // Slightly stronger border for contrast
  fieldFocusBorder: '#007afd',
  
  glassBorder:      'rgba(116, 119, 129, 0.30)',
  divider:          'rgba(116, 119, 129, 0.20)',
  footerBg:         'rgba(16, 19, 27, 0.60)',
  segBg:            'rgba(24, 28, 36, 0.70)', // based on #181c24 (surface-container-low)
  rowHover:         'rgba(89, 119, 176, 0.15)', // secondary #5977b0

  // ── Text ─────────────────────────────────────────────────────────────────────
  text:      '#e0e2ed', // on-surface
  textSoft:  '#c1c6d7', // on-surface-variant
  textMuted: 'rgba(193, 198, 215, 0.60)',

  // ── Accents ──────────────────────────────────────────────────────────────────
  accent:       '#007afd', // Primary: macOS Blue
  accentText:   '#adc7ff', // surface-tint / primary from yaml
  accentSoft:   'rgba(0, 122, 253, 0.20)',
  accentBorder: 'rgba(0, 122, 253, 0.40)',
  accentRing:   '0 0 0 3px rgba(0, 122, 253, 0.30)',

  // ── Status ───────────────────────────────────────────────────────────────────
  warningDot: '#d85701', // Tertiary: Rust accent

  // ── Typography ───────────────────────────────────────────────────────────────
  font: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",

  // ── Elevation ────────────────────────────────────────────────────────────────
  // Level 3 (Popovers/Menus): Soft, wide-spread ambient shadow
  popoverShadow: [
    '0 10px 30px rgba(0,0,0,0.2)',
    'inset 0 1px 0 rgba(255,255,255,0.10)',
  ].join(', '),

  // ── Shape ────────────────────────────────────────────────────────────────────
  radius:     16, // larger window wrappers
  radiusMd:   8,  // primary containers
  radiusSm:   6,
  radiusChip: 4,  // small components
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(iso) {
  if (!iso) return ''
  const d   = new Date(iso)
  const now  = new Date()
  const tom  = new Date(now); tom.setDate(now.getDate() + 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === tom.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

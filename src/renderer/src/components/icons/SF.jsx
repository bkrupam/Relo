// SF Symbol-style icon set — thin rounded strokes, 20×20 viewBox
// n = icon name, s = size (px), w = stroke width, c = color, filled = use fill
export function SF({ n, s = 15, w = 1.4, c = 'currentColor', filled = false }) {
  const p = {
    width: s, height: s, viewBox: '0 0 20 20',
    fill: filled ? c : 'none',
    stroke: filled ? 'none' : c,
    strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' },
  }

  switch (n) {
    // ── Notifications ───────────────────────────────────────────────────────
    case 'bell':
      return <svg {...p}><path d="M10 2.5c-2.5 0-4.5 2-4.5 4.5v3l-1.2 2.5h11.4l-1.2-2.5v-3c0-2.5-2-4.5-4.5-4.5z"/><path d="M8.5 15a1.5 1.5 0 003 0"/></svg>
    case 'bell.fill':
      return <svg {...p} fill={c} stroke="none"><path d="M10 2.5c-2.5 0-4.5 2-4.5 4.5v3l-1.2 2.5h11.4l-1.2-2.5v-3c0-2.5-2-4.5-4.5-4.5z"/><path d="M8.5 15a1.5 1.5 0 003 0"/></svg>

    // ── Arrows / direction ──────────────────────────────────────────────────
    case 'arrow.up':
      return <svg {...p}><path d="M10 16V4M5 9l5-5 5 5"/></svg>
    case 'arrow.clockwise':
      return <svg {...p}><path d="M3.5 10a6.5 6.5 0 0111-4.5L16 7"/><path d="M16 3v4h-4"/></svg>
    case 'chevron.right':
      return <svg {...p}><path d="M7.5 4l5 6-5 6"/></svg>
    case 'chevron.left':
      return <svg {...p}><path d="M12.5 4l-5 6 5 6"/></svg>
    case 'chevron.down':
      return <svg {...p}><path d="M4 7.5l6 5 6-5"/></svg>

    // ── Actions ─────────────────────────────────────────────────────────────
    case 'plus':
      return <svg {...p}><path d="M10 4v12M4 10h12"/></svg>
    case 'xmark':
      return <svg {...p}><path d="M5 5l10 10M15 5l-10 10"/></svg>
    case 'check':
      return <svg {...p}><path d="M4 10.5L8 14.5L16 5.5"/></svg>
    case 'trash':
      return <svg {...p}><path d="M4 6h12M7 6V4h6v2M8 10v5M12 10v5M5 6l1 10h8l1-10"/></svg>
    case 'square.and.pencil':
      return <svg {...p}><path d="M14 3l3 3-9 9H5v-3z"/><path d="M3 17h14"/></svg>

    // ── Status / state ──────────────────────────────────────────────────────
    case 'checkmark.circle':
      return <svg {...p}><circle cx="10" cy="10" r="7.5"/><path d="M6.5 10.5L9 13L13.5 7.5"/></svg>
    case 'checkmark.circle.fill':
      return <svg {...p} fill={c} stroke="none"><path d="M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm3.5 5l-4.5 5.5-2.5-2.5 1-1 1.5 1.5 3.5-4.5 1 1z"/></svg>
    case 'xmark.circle':
      return <svg {...p}><circle cx="10" cy="10" r="7.5"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5"/></svg>
    case 'exclamationmark.circle':
      return <svg {...p}><circle cx="10" cy="10" r="7.5"/><path d="M10 7v4.5"/><path d="M10 13.8v.1"/></svg>
    case 'circle':
      return <svg {...p}><circle cx="10" cy="10" r="6.5"/></svg>
    case 'circle.dotted':
      return <svg {...p} strokeDasharray="1.5 2.2"><circle cx="10" cy="10" r="6.5"/></svg>

    // ── Time / calendar ─────────────────────────────────────────────────────
    case 'clock':
      return <svg {...p}><circle cx="10" cy="10" r="7.5"/><path d="M10 5.5V10l3 1.8"/></svg>
    case 'calendar':
      return <svg {...p}><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/></svg>
    case 'calendar.badge.plus':
      return <svg {...p}><rect x="2" y="4" width="13" height="12" rx="2"/><path d="M2 8h13M6 2.5v3M11 2.5v3"/><path d="M16 12h3M17.5 10.5v3"/></svg>

    // ── People ──────────────────────────────────────────────────────────────
    case 'person':
      return <svg {...p}><circle cx="10" cy="7" r="3"/><path d="M4 17a6 6 0 0112 0"/></svg>

    // ── System / settings ───────────────────────────────────────────────────
    case 'gearshape':
      return <svg {...p}><circle cx="10" cy="10" r="2.3"/><path d="M16.5 10c0-.4 0-.8-.1-1.2l1.5-1.1-1.5-2.6-1.7.7c-.6-.5-1.3-.9-2-1.1l-.3-1.8h-3l-.3 1.8c-.7.2-1.4.6-2 1.1l-1.7-.7-1.5 2.6 1.5 1.1c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-1.5 1.1 1.5 2.6 1.7-.7c.6.5 1.3.9 2 1.1l.3 1.8h3l.3-1.8c.7-.2 1.4-.6 2-1.1l1.7.7 1.5-2.6-1.5-1.1c.1-.4.1-.8.1-1.2z"/></svg>
    case 'magnifying':
      return <svg {...p}><circle cx="9" cy="9" r="5.5"/><path d="M17 17l-4-4"/></svg>

    // ── Links / sources ─────────────────────────────────────────────────────
    case 'link':
      return <svg {...p}><path d="M9 11a3.5 3.5 0 005 0l3-3a3.5 3.5 0 00-5-5l-1 1"/><path d="M11 9a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 005 5l1-1"/></svg>
    case 'sparkles':
      return <svg {...p}><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.5 5.5l1.4 1.4M13.1 13.1l1.4 1.4M14.5 5.5l-1.4 1.4M6.9 13.1l-1.4 1.4"/></svg>

    // ── Connections ─────────────────────────────────────────────────────────
    case 'wifi':
      return <svg {...p}><circle cx="10" cy="16" r="1.2"/><path d="M7 13a4.3 4.3 0 016 0"/><path d="M4 10a8 8 0 0112 0"/><path d="M1.5 7.5A11.5 11.5 0 0118.5 7.5"/></svg>
    case 'wifi.slash':
      return <svg {...p}><circle cx="10" cy="16" r="1.2"/><path d="M7 13a4.3 4.3 0 016 0"/><path d="M4 10a8 8 0 0112 0"/><path d="M1.5 7.5A11.5 11.5 0 0118.5 7.5"/><path d="M3 3l14 14"/></svg>

    // ── macOS menu bar icons ─────────────────────────────────────────────────
    case 'apple':
      return <svg width={s * 0.85} height={s} viewBox="0 0 11 13" fill={c} style={p.style}><path d="M9.07 9.84c-.16.36-.35.68-.57.99-.3.42-.55.71-.74.87-.3.27-.62.4-.96.41-.25 0-.55-.07-.9-.21-.35-.14-.67-.21-.96-.21-.31 0-.64.07-.99.21-.35.14-.64.22-.86.23-.33.01-.65-.13-.97-.42-.21-.18-.47-.48-.78-.91-.34-.46-.61-.99-.83-1.6-.23-.66-.35-1.3-.35-1.92 0-.71.15-1.32.46-1.83.24-.41.56-.74.96-.97.4-.24.83-.36 1.3-.37.27 0 .61.08 1.04.24.43.16.7.24.82.24.09 0 .39-.09.9-.27.48-.17.89-.24 1.22-.21.91.07 1.59.43 2.04 1.07-.81.49-1.21 1.18-1.2 2.07.01.69.26 1.27.75 1.73.22.21.47.37.74.49-.06.17-.12.33-.19.49zM7.05 1.27c0 .53-.19 1.03-.58 1.49-.46.55-1.02.86-1.63.81-.01-.06-.01-.13-.01-.2 0-.51.22-1.05.61-1.5.19-.22.44-.41.74-.56.3-.15.58-.23.85-.25 0 .07.02.14.02.21z"/></svg>
    case 'battery':
      return <svg width={s * 1.5} height={s * 0.8} viewBox="0 0 26 13" fill="none" style={p.style}><rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke={c} opacity="0.7"/><rect x="2" y="2" width="18" height="9" rx="1.5" fill={c}/><rect x="23.5" y="4" width="2" height="5" rx="0.7" fill={c} opacity="0.7"/></svg>
    case 'control.center':
      return <svg {...p}><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></svg>

    default:
      return null
  }
}

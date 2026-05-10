import { T } from '../../tokens'
import { Pop, PopHead, Field, SendBtn, GlassCard } from '../Primitives'

export function LoadingScreen({ state }) {
  const { inputText } = state

  return (
    <Pop>
      <PopHead />

      <Field focused={false}>
        <div style={{ fontSize: 14, lineHeight: '21px', color: T.textSoft, minHeight: 52, paddingRight: 4, opacity: 0.6 }}>
          {inputText}
        </div>
        <SendBtn state="loading" />
      </Field>

      <div style={{ padding: '0 13px 14px' }}>
        <GlassCard style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 14, height: 14, flexShrink: 0,
            border: `1.5px solid ${T.textSoft}`,
            borderTopColor: 'transparent',
            borderRadius: 99,
            display: 'inline-block',
          }} className="animate-spin-sm" />
          <span style={{ fontSize: 13.5, color: T.text }}>Adding to Calendar</span>
        </GlassCard>
      </div>
    </Pop>
  )
}

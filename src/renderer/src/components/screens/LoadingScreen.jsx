import { Pop, PopHead, Composer, GlassCard } from '../Primitives'

export function LoadingScreen({ state }) {
  const { inputText } = state

  return (
    <Pop>
      <PopHead />

      <Composer focused={false} sendState="loading">
        <div className="text-sm leading-snug text-muted-foreground/60 opacity-60 min-h-[52px] pr-1 select-none pointer-events-none">
          {inputText}
        </div>
      </Composer>

      <div className="px-3.5 pb-3.5">
        <GlassCard className="flex items-center gap-2.5 px-3.5 py-3.5">
          <span className="size-3.5 shrink-0 rounded-full border-[1.5px] border-muted-foreground border-t-transparent animate-spin" />
          <span className="text-sm text-foreground">Adding to Calendar</span>
        </GlassCard>
      </div>
    </Pop>
  )
}

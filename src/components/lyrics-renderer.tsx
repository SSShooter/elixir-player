"use client"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Lyrics } from "@/lib/lyrics"
import { useMemo } from "react"

export default function LyricsRenderer({
  lyrics,
  showTimestamp = false,
  showTranslation = true,
  currentTime,
}: {
  lyrics: Lyrics
  showTimestamp?: boolean
  showTranslation?: boolean
  currentTime?: number
}) {
  const activeIndex = useMemo(() => {
    if (currentTime == null) return -1
    const timed = lyrics.lines.filter((l) => l.time != null)
    for (let i = timed.length - 1; i >= 0; i--) {
      if ((timed[i].time ?? 0) <= currentTime) return lyrics.lines.indexOf(timed[i])
    }
    return -1
  }, [lyrics, currentTime])

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-2">
        {lyrics.lines.map((line, idx) => (
          <div
            key={`${line.time}-${idx}`}
            className={
              idx === activeIndex
                ? "text-primary font-semibold"
                : "text-zinc-800 dark:text-zinc-200"
            }
          >
            {showTimestamp && (
              <span className="mr-2 text-xs text-zinc-500">
                {line.time != null ? formatTime(line.time) : "--:--"}
              </span>
            )}
            <span>{line.text}</span>
            {showTranslation && line.translation && (
              <span className="ml-3 text-sm text-zinc-500">{line.translation}</span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function formatTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}


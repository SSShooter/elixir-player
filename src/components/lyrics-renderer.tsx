"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lyrics } from "@/lib/lyrics"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LyricsRenderer({
  lyrics,
  showTimestamp = false,
  currentTime = 0,
  coverUrl,
  onSeek,
}: {
  lyrics: Lyrics
  showTimestamp?: boolean
  currentTime?: number
  coverUrl?: string
  onSeek?: (time: number) => void
}) {
  const [showTranslation, setShowTranslation] = useState(true)
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  
  const activeRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Refactored scroll function
  const scrollToActive = useCallback(() => {
    if (activeRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const element = activeRef.current
      
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      const offset = elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2)
      
      container.scrollTo({
        top: container.scrollTop + offset,
        behavior: "smooth"
      })
    }
  }, [])

  // Calculate active index
  const activeIndex = useMemo(() => {
    if (currentTime == null) return -1
    const timed = lyrics.lines.filter((l) => l.time != null)
    let index = -1
    for (let i = timed.length - 1; i >= 0; i--) {
      // Small offset (0.2s) for better visual sync
      if ((timed[i].time ?? 0) <= currentTime + 0.2) {
        index = lyrics.lines.indexOf(timed[i])
        break
      }
    }
    return index
  }, [lyrics, currentTime])

  // Manual scroll logic
  useEffect(() => {
    if (isAutoScroll) {
      scrollToActive()
    }
  }, [activeIndex, isAutoScroll, scrollToActive])

  // User interaction handlers to pause auto-scroll
  const handleUserInteraction = () => {
    setIsAutoScroll(false)
  }

  const scrollToCurrent = () => {
    setIsAutoScroll(true)
    scrollToActive()
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-xl bg-zinc-900 border border-white/10 h-[500px] md:h-[600px] lg:h-[650px]">
       {/* Background Blur Effect - Matching Player */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center blur-2xl transform scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${coverUrl || "/placeholder.png"})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Lyrics
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Translation</span>
          <Switch 
            checked={showTranslation} 
            onCheckedChange={setShowTranslation}
            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/20" 
          />
        </div>
      </div>

      {/* Scrollable Area */}
      <ScrollArea ref={scrollContainerRef} className="relative z-10 h-[calc(100%-65px)] bg-transparent">
        <div 
          className="flex flex-col py-10 px-4 md:px-6 pb-32"
          onWheel={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          {lyrics.lines.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-white/40">
              No lyrics available
            </div>
          ) : (
            lyrics.lines.map((line, idx) => {
              const isActive = idx === activeIndex
              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeRef : null}
                  className={cn(
                    "flex flex-col gap-1 py-3 px-3 md:px-4 rounded-xl transition-all duration-300 group/line select-none md:select-text",
                    line.time != null ? "cursor-pointer" : "cursor-default",
                    isActive
                      ? "bg-white/10 shadow-lg scale-[1.01] my-1"
                      : "hover:bg-white/5 opacity-40 hover:opacity-100"
                  )}
                  onClick={() => line.time != null && onSeek?.(line.time)}
                >
                  <div className="flex gap-4 items-baseline">
                    {showTimestamp && line.time != null && (
                      <span className={cn(
                        "text-xs font-mono shrink-0 transition-colors w-10 text-right",
                        isActive ? "text-white/70" : "text-white/30"
                      )}>
                        {formatTime(line.time)}
                      </span>
                    )}
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-center gap-4">
                        <p className={cn(
                          "text-lg font-medium leading-tight tracking-tight transition-colors",
                           isActive ? "text-white scale-100" : "text-white/80"
                        )}>
                          {line.text || "♪"}
                        </p>
                      </div>
                      
                      {showTranslation && line.translation && (
                        <p className={cn(
                          "text-sm text-center transition-colors mt-1 leading-relaxed",
                          isActive ? "text-white/60" : "text-white/40"
                        )}>
                          {line.translation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Resume Auto-Scroll Button */}
      {!isAutoScroll && (
        <div className="absolute bottom-6 right-6 z-20 animate-in fade-in slide-in-from-bottom-2">
            <Button 
                size="sm" 
                variant="secondary"
                onClick={scrollToCurrent}
                className="rounded-full shadow-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
            >
                <ChevronDown className="w-3 h-3 mr-1.5" />
                Resume
            </Button>
        </div>
      )}
    </div>
  )
}

function formatTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

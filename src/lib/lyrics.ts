export type LyricLine = {
  time: number | null
  text: string
  translation?: string
}

export type Lyrics = {
  lines: LyricLine[]
}

const timeTag = /\[(\d{1,2}):(\d{1,2})(?:[:.])(\d{1,3})\]/g

export function parseLrc(lrc: string, tlyric?: string): Lyrics {
  const tMap = buildTranslationMap(tlyric)
  const tTimes = Array.from(tMap.keys())
  const lines: LyricLine[] = []
  const rawLines = lrc.split(/\r?\n/)
  for (const line of rawLines) {
    const tags = Array.from(line.matchAll(timeTag))
    const text = line.replace(timeTag, "").trim()
    if (tags.length === 0) {
      lines.push({ time: null, text })
      continue
    }
    for (const m of tags) {
      const min = Number(m[1])
      const sec = Number(m[2])
      const ms = m[3] ? Number(m[3]) : 0
      const time = min * 60 + sec + ms / 1000
      const translation = findClosestTranslation(time, tMap, tTimes)
      lines.push({ time, text, translation })
    }
  }
  // sort by time but keep nulls at top in order
  const timed = lines.filter((l) => l.time != null).sort((a, b) => (a.time! - b.time!))
  return { lines: timed }
}

function findClosestTranslation(time: number, tMap: Map<number, string>, tTimes: number[]): string | undefined {
  if (tMap.has(time)) return tMap.get(time)
  let closest = -1
  let minDiff = Infinity
  for (const t of tTimes) {
    const diff = Math.abs(t - time)
    if (diff < minDiff) {
      minDiff = diff
      closest = t
    }
  }
  return minDiff < 1 ? tMap.get(closest) : undefined
}

function buildTranslationMap(tlyric?: string): Map<number, string> {
  const map = new Map<number, string>()
  if (!tlyric) return map
  const raw = tlyric.split(/\r?\n/)
  for (const line of raw) {
    const text = line.replace(timeTag, "").trim()
    const times = Array.from(line.matchAll(timeTag))
    for (const m of times) {
      const min = Number(m[1])
      const sec = Number(m[2])
      const ms = m[3] ? Number(m[3]) : 0
      const time = min * 60 + sec + ms / 1000
      if (text) map.set(time, text)
    }
  }
  return map
}

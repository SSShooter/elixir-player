"use client"
import { useEffect, useRef } from "react"

import { type SongResult } from "@/hooks/use-api"
import { format } from "date-fns"
import { Music2, X } from "lucide-react"

interface SharePreviewProps {
  songs: SongResult[]
  playlistTitle: string
  onImagesLoaded?: (isLoaded: boolean) => void
  onRemoveSong?: (id: string | number) => void
}

export function SharePreview({ songs, playlistTitle, onImagesLoaded, onRemoveSong }: SharePreviewProps) {
  const currentDate = format(new Date(), "yyyy/MM/dd")
  // Use a set to track which image URLs have reported loaded/error
  const loadedUrls = useRef<Set<string>>(new Set())

  // Check if all current songs have their images loaded
  const checkAllLoaded = () => {
    const songsWithCover = songs.filter(s => s.cover_url)
    if (songsWithCover.length === 0) {
      onImagesLoaded?.(true)
      return
    }

    // Check if every song's cover URL is in our loaded set
    const allLoaded = songsWithCover.every(s => s.cover_url && loadedUrls.current.has(s.cover_url))
    onImagesLoaded?.(allLoaded)
  }

  // Check whenever songs change
  useEffect(() => {
    checkAllLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs])

  const handleImageLoad = (url: string) => {
    loadedUrls.current.add(url)
    checkAllLoaded()
  }

  return (
    <div
      id="share-preview"
      className="share-preview-container relative w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
    >
      {/* Container wrapper for fixed width export */}
      <div className="w-[800px] min-h-[1000px] bg-white text-zinc-900 flex flex-col p-12 mx-auto shadow-2xl relative">

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-200 to-transparent opacity-50 rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-pink-200 to-transparent opacity-50 rounded-tr-full pointer-events-none" />

        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 border-b-2 border-black pb-6 z-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase break-words max-w-[500px] leading-[0.9]">
              {playlistTitle || "MY PLAYLIST"}
            </h1>
            <p className="text-xl font-medium text-zinc-500 tracking-widest">
              VOL.01
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold tracking-widest uppercase mb-1">Created Date</div>
            <div className="text-2xl font-mono font-bold">{currentDate}</div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-10 flex-1 content-start z-10">
          {songs.slice(0, 12).map((song, index) => (
            <div key={song.id || index} className="flex flex-col gap-3 group">
              {/* Cover Image */}
              <div className="aspect-square w-full bg-zinc-100 relative overflow-hidden shadow-lg border-2 border-black transition-transform group-hover:scale-[1.02]">
                {song.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(song.cover_url)}`}
                    alt={song.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onLoad={() => song.cover_url && handleImageLoad(song.cover_url)}
                    onError={() => song.cover_url && handleImageLoad(song.cover_url)} // Count errors as loaded too so we don't block forever
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-200">
                    <Music2 className="w-12 h-12 text-zinc-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold rounded-sm z-10">
                  {index + 1}
                </div>
                {onRemoveSong && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSong(song.id)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                    title="Remove song"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Song Info */}
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate w-full mb-1" title={song.name}>
                  {song.name}
                </h3>
                <p className="text-sm font-semibold text-zinc-500 truncate w-full" title={Array.isArray(song.artist) ? song.artist.join(", ") : song.artist}>
                  {Array.isArray(song.artist) ? song.artist.join(", ") : song.artist}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-200 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
              EP
            </div>
            <span className="font-bold tracking-tight">Elixir Player</span>
          </div>
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest">
            Music Collection / Share your taste
          </p>
        </div>

      </div>
    </div>
  )
}

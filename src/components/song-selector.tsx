"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Provider } from "@/components/provider-selector"
import { useSearchSongs, type SongResult } from "@/hooks/use-api"
import { Search, Plus, Check } from "lucide-react"

interface SongSelectorProps {
    selectedSongs: SongResult[]
    onAddSong: (song: SongResult) => void
    maxSongs?: number
    provider: Provider
}

export function SongSelector({
    selectedSongs,
    onAddSong,
    maxSongs = 12,
    provider
}: SongSelectorProps) {
    const [keyword, setKeyword] = useState("")
    const [searchKeyword, setSearchKeyword] = useState("")

    const { data: results = [], isLoading } = useSearchSongs(searchKeyword, provider)

    function handleSearch() {
        if (!keyword.trim()) return
        setSearchKeyword(keyword)
    }

    function isSongSelected(song: SongResult) {
        return selectedSongs.some(s => s.id === song.id)
    }

    const canAddMore = selectedSongs.length < maxSongs

    return (
        <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="搜索歌曲名、歌手..."
                        className="pl-10"
                    />
                </div>
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? "搜索中..." : "搜索"}
                </Button>
            </div>

            {/* Search results */}
            <div className="border rounded-lg bg-white dark:bg-zinc-900 max-h-96 overflow-y-auto">
                {results.length === 0 && !isLoading && searchKeyword && (
                    <div className="text-center py-8 text-zinc-500">
                        暂无搜索结果
                    </div>
                )}

                {results.length === 0 && !searchKeyword && (
                    <div className="text-center py-8 text-zinc-500">
                        搜索歌曲以添加到歌单
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8 text-zinc-500">
                        加载中...
                    </div>
                )}

                {results.map((song) => {
                    const isSelected = isSongSelected(song)
                    const canAdd = canAddMore || isSelected

                    return (
                        <div
                            key={song.id}
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="font-medium truncate">{song.name}</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                    {Array.isArray(song.artist) ? song.artist.join(", ") : song.artist}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">{song.album}</p>
                            </div>

                            <Button
                                size="sm"
                                variant={isSelected ? "secondary" : "default"}
                                onClick={() => onAddSong(song)}
                                disabled={!canAdd}
                            >
                                {isSelected ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        已添加
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        添加
                                    </>
                                )}
                            </Button>
                        </div>
                    )
                })}
            </div>

            {/* Song count indicator */}
            {selectedSongs.length > 0 && (
                <div className="text-sm text-center text-zinc-600 dark:text-zinc-400">
                    已选择 {selectedSongs.length} / {maxSongs} 首歌曲
                </div>
            )}
        </div>
    )
}

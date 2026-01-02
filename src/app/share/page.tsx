"use client"

import { useState, Suspense } from "react"
import { NavMenu } from "@/components/nav-menu"
import { SharePreview } from "@/components/share-preview"
import { SongSelector } from "@/components/song-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Provider } from "@/components/provider-selector"
import { ProviderSelector } from "@/components/provider-selector"
import { type SongResult } from "@/hooks/use-api"
import { Download, Trash2 } from "lucide-react"
import { snapdom } from "@zumer/snapdom"

function ShareContent() {
    const [selectedSongs, setSelectedSongs] = useState<SongResult[]>([])
    const [playlistTitle, setPlaylistTitle] = useState("我的歌单")
    const [provider, setProvider] = useState<Provider>("tencent")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isImagesLoaded, setIsImagesLoaded] = useState(false)

    // Debug log
    if (selectedSongs.length > 0) {
        console.log("Selected Songs Data:", selectedSongs)
    }

    function handleAddSong(song: SongResult) {
        const isAlreadySelected = selectedSongs.some(s => s.id === song.id)

        if (isAlreadySelected) {
            // Remove song if already selected
            setSelectedSongs(selectedSongs.filter(s => s.id !== song.id))
        } else {
            // Add song if not at max capacity
            if (selectedSongs.length < 12) {
                setSelectedSongs([...selectedSongs, song])
            }
        }
    }

    function handleRemoveSong(songId: string | number) {
        setSelectedSongs(selectedSongs.filter(s => s.id !== songId))
    }

    async function handleGenerateImage() {
        setIsGenerating(true)
        try {
            const element = document.getElementById("share-preview")
            if (!element) {
                throw new Error("Preview element not found")
            }

            // Generate image using snapdom
            const result = await snapdom(element, {
                scale: 2, // Higher quality
                width: 1200,
                height: 1600,
            })

            // Download the image
            await result.download({
                filename: `${playlistTitle}-${new Date().getTime()}`,
            })
        } catch (error) {
            console.error("Failed to generate image:", error)
            alert("生成图片失败，请重试")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex flex-col w-full max-w-7xl h-full py-10 px-6">
                <NavMenu />

                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">歌单分享</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        选择最多 12 首歌曲，生成精美的分享图片
                    </p>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    {/* Left panel: Song selection */}
                    <div className="flex flex-col gap-6 overflow-y-auto">
                        {/* Playlist title input */}
                        <div className="space-y-2">
                            <Label htmlFor="playlist-title">歌单标题</Label>
                            <Input
                                id="playlist-title"
                                value={playlistTitle}
                                onChange={(e) => setPlaylistTitle(e.target.value)}
                                placeholder="输入歌单标题..."
                                className="text-lg font-semibold"
                            />
                        </div>

                        {/* Provider selector */}
                        <div className="space-y-2">
                            <Label>音乐平台</Label>
                            <ProviderSelector value={provider} onValueChange={setProvider} />
                        </div>

                        {/* Song selector */}
                        <div className="space-y-2">
                            <Label>搜索并添加歌曲</Label>
                            <SongSelector
                                selectedSongs={selectedSongs}
                                onAddSong={handleAddSong}
                                maxSongs={12}
                                provider={provider}
                            />
                        </div>

                    </div>


                    {/* Right panel: Preview and actions (Center the preview to avoid overflow) */}
                    <div className="flex flex-col gap-4 overflow-hidden">
                        <Label>分享预览 (生成图片时请勿切换页面)</Label>

                        {/* Preview Container - Scaled down for display if needed, but keeping full size in DOM for export */}
                        <div className="flex-1 flex items-start justify-center overflow-auto bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border relative">
                            {/* 
                               Scaling container: 
                               We use a scaling transform to fit the large export-ready component into the UI.
                             */}
                            <div className="origin-top scale-[0.45] sm:scale-[0.6] lg:scale-[0.5] xl:scale-[0.6] 2xl:scale-[0.7] h-[1000px] w-[800px] shrink-0 mb-[-400px]">
                                <SharePreview
                                    songs={selectedSongs}
                                    playlistTitle={playlistTitle}
                                    onImagesLoaded={setIsImagesLoaded}
                                    onRemoveSong={handleRemoveSong}
                                />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-4">
                            <Button
                                onClick={handleGenerateImage}
                                disabled={selectedSongs.length === 0 || isGenerating || !isImagesLoaded}
                                className="flex-1"
                                size="lg"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                {isGenerating ? "生成中..." : (!isImagesLoaded && selectedSongs.length > 0) ? "加载图片中..." : "下载分享图片"}
                            </Button>
                        </div>

                        {selectedSongs.length === 0 && (
                            <p className="text-center text-sm text-zinc-500">
                                请先添加歌曲以生成分享图片
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function SharePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
                <div className="text-zinc-500">加载中...</div>
            </div>
        }>
            <ShareContent />
        </Suspense>
    )
}

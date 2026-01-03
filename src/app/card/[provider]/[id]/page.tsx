"use client";

import { useParams } from "next/navigation";
import { SongCard } from "@/components/song-card";
import { useLyrics } from "@/hooks/use-api";
import { Provider } from "@/components/provider-selector";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardPage() {
    const params = useParams();
    const provider = params.provider as Provider;
    const id = params.id as string;

    // We use useLyrics to get coverUrl and songInfo
    const { data: lyricsData, isLoading, error } = useLyrics(id, provider);

    if (isLoading || error || !lyricsData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
                <div className="relative w-full mx-auto">
                    <div className="w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shadow-xl relative">
                        <div className="p-3 flex items-center gap-4 h-20 md:h-24">
                            <Skeleton className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg bg-zinc-800" />
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                                <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                                <Skeleton className="h-3 w-1/4 bg-zinc-800 opacity-60" />
                                <Skeleton className="h-3 w-1/5 bg-zinc-800 opacity-40" />
                            </div>
                        </div>
                    </div>
                    {/* Internal Player Button Skeleton */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10 p-2 bg-white/5 rounded-full border border-white/5">
                        <Skeleton className="w-5 h-5 rounded-full bg-zinc-800" />
                    </div>
                </div>
            </div>
        );
    }

    const { coverUrl, songInfo } = lyricsData;

    // Fallback for songInfo if missing
    const safeSongInfo = songInfo || {
        name: "未知歌曲",
        artist: ["未知艺术家"],
        album: "未知专辑",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
            <SongCard
                id={id}
                provider={provider}
                coverUrl={coverUrl || ""}
                songInfo={safeSongInfo}
            />
        </div>
    );
}

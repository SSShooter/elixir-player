"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { NavMenu } from "@/components/nav-menu"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Provider } from "@/components/provider-selector"
import { usePlaylistSongs, type SongResult } from "@/hooks/use-api"

function PlaylistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Local state for input fields only
  const [playlistId, setPlaylistId] = useState(searchParams.get("id") || "")
  const [provider, setProvider] = useState<Provider>((searchParams.get("provider") as Provider) || "tencent")

  // Use the custom hook with URL params
  const urlId = searchParams.get("id") || ""
  const urlProvider = (searchParams.get("provider") as Provider) || "tencent"

  const { data: results = [], isLoading: loading, error } = usePlaylistSongs(urlId, urlProvider)

  function handleLookup() {
    if (!playlistId) return
    const params = new URLSearchParams(searchParams)
    params.set("id", playlistId)
    params.set("provider", provider)
    router.replace(`${pathname}?${params.toString()}`)
  }

  function handleSelect(minfo: SongResult) {
    const songId = minfo.id || minfo.url_id
    if (!songId) return
    router.push(`/?id=${songId}&provider=${provider}`)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl py-10 px-6">
        <NavMenu />
        
        <PageHeader 
          title="歌单查找"
          provider={provider}
          setProvider={setProvider}
          inputValue={playlistId}
          setInputValue={setPlaylistId}
          placeholder="输入歌单 ID 或链接..."
          actionLabel="查找"
          onAction={handleLookup}
          loading={loading}
        />

        {error && <p className="text-red-500 mb-4">Error: {(error as Error).message}</p>}

        <div className="border rounded-md bg-white dark:bg-zinc-900 overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="">歌曲名称</TableHead>
                <TableHead className="w-1/4">歌手</TableHead>
                <TableHead className="w-1/4">专辑</TableHead>
                <TableHead className="w-[90px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500 h-24">
                    暂无歌单数据
                  </TableCell>
                </TableRow>
              )}
              {results.map((song, idx) => (
                <TableRow key={song.id || idx}>
                  <TableCell className="font-medium truncate">{song.name}</TableCell>
                  <TableCell className="truncate">{Array.isArray(song.artist) ? song.artist.join(", ") : song.artist}</TableCell>
                  <TableCell className="truncate">{song.album}</TableCell>
                  <TableCell className="">
                    <Button size="sm" onClick={() => handleSelect(song)}>
                      选择
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500 h-24">
                    加载中...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}

export default function PlaylistPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-zinc-500">加载中...</div>
      </div>
    }>
      <PlaylistContent />
    </Suspense>
  )
}

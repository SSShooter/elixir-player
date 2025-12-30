"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { NavMenu } from "@/components/nav-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Provider = "netease" | "tencent" | "kugou" | "baidu" | "kuwo"

interface SongResult {
  id: string | number
  name: string
  artist: string[]
  album: string
  url_id?: string | number
  pic_id?: string | number
}

export default function PlaylistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [playlistId, setPlaylistId] = useState(searchParams.get("id") || "")
  const [provider, setProvider] = useState<Provider>((searchParams.get("provider") as Provider) || "tencent")
  const [results, setResults] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Effect to fetch data when URL params change
  useEffect(() => {
    const id = searchParams.get("id")
    const prov = (searchParams.get("provider") as Provider) || "tencent"

    // Sync input state
    if (id && id !== playlistId) setPlaylistId(id)
    if (prov && prov !== provider) setProvider(prov)

    if (id) {
      doLookup(id, prov)
    }
  }, [searchParams])

  async function doLookup(id: string, prov: Provider) {
    setLoading(true)
    setError("")
    // setResults([])

    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: prov,
          value: id,
        }),
      })
      if (!res.ok) throw new Error("Playlist lookup failed")
      const data = await res.json()
      if (Array.isArray(data)) {
        setResults(data)
      } else {
        setResults([])
        if (data.error) setError(data.error)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleLookup() {
    if (!playlistId) return
    const params = new URLSearchParams(searchParams)
    params.set("id", playlistId)
    params.set("provider", provider)
    router.push(`${pathname}?${params.toString()}`)
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
        
        <h1 className="text-xl font-bold mb-4">歌单查找</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-32">
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger>
                <SelectValue placeholder="平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netease">网易云</SelectItem>
                <SelectItem value="tencent">QQ音乐</SelectItem>
                <SelectItem value="kugou">酷狗</SelectItem>
                <SelectItem value="kuwo">酷我</SelectItem>
                <SelectItem value="baidu">百度</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex gap-2">
            <Input 
              placeholder="输入歌单 ID 或链接..." 
              value={playlistId} 
              onChange={(e) => setPlaylistId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
            <Button onClick={handleLookup} disabled={loading}>
              {loading ? "查找中..." : "查找"}
            </Button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="border rounded-md bg-white dark:bg-zinc-900 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">歌曲名称</TableHead>
                <TableHead className="min-w-[150px]">歌手</TableHead>
                <TableHead className="min-w-[150px]">专辑</TableHead>
                <TableHead className="w-[100px] sticky right-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700">操作</TableHead>
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
                  <TableCell className="font-medium whitespace-nowrap">{song.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{Array.isArray(song.artist) ? song.artist.join(", ") : song.artist}</TableCell>
                  <TableCell className="whitespace-nowrap">{song.album}</TableCell>
                  <TableCell className="sticky right-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700">
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

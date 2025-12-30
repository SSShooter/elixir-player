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
  // Meting sometimes returns unexpected structures, adapt as needed
  url_id?: string | number // backup id
  pic_id?: string | number
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "")
  const [provider, setProvider] = useState<Provider>((searchParams.get("provider") as Provider) || "tencent")
  const [results, setResults] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Sync state with URL params on change (e.g. back button)
  // We prefer the URL params to be the source of truth for the inputs when they change
  // allowing the user to see what they are searching for if they arrive via link
  // However, we also want the input to be editable without constantly resetting if we typed but didn't search.
  // Actually, usually inputs are uncontrolled or loose specific sync. 
  // But if we hit back, we want the input to revert.
  // Simple approach: Sync on mount and param change.
  // Warning: If I type "A" and params are "B", typing triggers state change. 
  // If I don't push, params stay "B". Pass.
  
  // Effect to fetch data when URL params change
  useEffect(() => {
    const kw = searchParams.get("keyword")
    const prov = (searchParams.get("provider") as Provider) || "tencent"
    
    // Update local state to match URL (useful for back button)
    if (kw && kw !== keyword) setKeyword(kw)
    if (prov && prov !== provider) setProvider(prov)

    if (kw) {
      doSearch(kw, prov)
    }
  }, [searchParams])

  async function doSearch(kw: string, prov: Provider) {
    setLoading(true)
    setError("")
    // setResults([]) // Keep previous results while loading

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: prov,
          keyword: kw,
          page: 1,
          limit: 30,
        }),
      })
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      // Meting usually returns an array of songs
      if (Array.isArray(data)) {
        setResults(data)
      } else {
        setResults([])
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    if (!keyword) return
    const params = new URLSearchParams(searchParams)
    params.set("keyword", keyword)
    params.set("provider", provider)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSelect(minfo: SongResult) {
    // Meting song object usually has `id`
    // Ensure we have an ID
    const songId = minfo.id || minfo.url_id
    if (!songId) return
    
    router.push(`/?id=${songId}&provider=${provider}`)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl py-10 px-6">
        <NavMenu />
        
        <h1 className="text-xl font-bold mb-4">歌曲搜索</h1>

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
              placeholder="输入歌曲名、歌手..." 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "搜索中..." : "搜索"}
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
                    暂无搜索结果
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

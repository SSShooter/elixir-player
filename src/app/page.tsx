"use client"
import { useEffect, useMemo, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import LyricsRenderer from "@/components/lyrics-renderer"
import AIConfig from "@/components/ai-config"
import { parseLrc, type Lyrics } from "@/lib/lyrics"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkCjkFriendly from "remark-cjk-friendly"
import { analyzePrompt } from "@/prompts/analyze"

type Provider = "netease" | "tencent" | "kugou" | "baidu" | "kuwo"

export default function Home() {
  const [provider, setProvider] = useState<Provider>("tencent")
  const [inputValue, setInputValue] = useState("")
  const [lyrics, setLyrics] = useState<Lyrics | null>(null)
  const [lyricError, setLyricError] = useState<string>("")
  const [analysis, setAnalysis] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [loading, setLoading] = useState(false)
  const [aLoading, setALoading] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  const [coverUrl, setCoverUrl] = useState("")
  const [songInfo, setSongInfo] = useState<{ name: string; artist: string[]; album: string } | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const analysisInProgressRef = useRef(false)

  useEffect(() => {
    const u = localStorage.getItem("ai_base_url")
    const k = localStorage.getItem("ai_api_key")
    const m = localStorage.getItem("ai_model")
    if (u) setBaseUrl(u)
    if (k) setApiKey(k)
    if (m) setModel(m)
  }, [])

  useEffect(() => {
    if (lyrics && inputValue) {
        const cacheKey = `analysis_${provider}_${inputValue}_${model}`
        const cachedAnalysis = localStorage.getItem(cacheKey)
        if (cachedAnalysis) {
          const parsed = JSON.parse(cachedAnalysis)
          setAnalysis(parsed.analysis || "")
          setReasoning(parsed.reasoning || "")
        } else {
          setAnalysis("")
          setReasoning("")
        }
      }
  }, [model, provider, lyrics, inputValue])

  useEffect(() => {
    if (!analysisInProgressRef.current && reasoning) {
      setShowReasoning(false)
    }
  }, [reasoning])

  const plainText = useMemo(() => {
    if (!lyrics) return ""
    return lyrics.lines.map((l) => {
      const timeStr = l.time != null ? `[${formatTime(l.time)}]` : ""
      return `${timeStr}${l.text}`
    }).join("\n")
  }, [lyrics])

  function formatTime(t: number) {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  async function fetchLyrics() {
    setLoading(true)
    setAnalysis("")
    setLyricError("")
    try {
      const source = /^https?:\/\//.test(inputValue) ? "url" : "id"
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, source, value: inputValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLyricError(String(data?.error || "lyrics_fetch_failed"))
        throw new Error(String(data?.error || "lyrics_fetch_failed"))
      }
      const lrc = String(data.lrc || "")
      const tlyric = String(data.tlyric || "")
      setLyrics(parseLrc(lrc, tlyric))
      setCoverUrl(data.coverUrl || "")
      setSongInfo(data.songInfo || null)
      
      const cacheKey = `analysis_${provider}_${inputValue}_${model}`
      const cachedAnalysis = localStorage.getItem(cacheKey)
      if (cachedAnalysis) {
        const parsed = JSON.parse(cachedAnalysis)
        setAnalysis(parsed.analysis || "")
        setReasoning(parsed.reasoning || "")
      }
    } catch {
      setLyrics(null)
      setCoverUrl("")
      setSongInfo(null)
    } finally {
      setLoading(false)
    }
  }

  async function analyze() {
    if (!lyrics) return
    setALoading(true)
    analysisInProgressRef.current = true
    setAnalysis("")
    setReasoning("")
    try {
      const defaultPrompt = "你是一位资深乐评人"
      const messages = [
        { role: "system", content: defaultPrompt },
        { role: "user", content: analyzePrompt(plainText, songInfo?.name, songInfo?.artist?.join(" / ")) },
      ]
      
      const res = await fetch(baseUrl + "/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          model, 
          messages,
          stream: true 
        }),
      })
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "analyze_failed")
      }
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let fullReasoning = ""
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || parsed.choices?.[0]?.delta?.reasoning
                if (content) {
                  fullContent += content
                  setAnalysis(fullContent)
                }
                if (reasoning) {
                  fullReasoning += reasoning
                  setReasoning(fullReasoning)
                }
              } catch {
              }
            }
          }
        }
      }
      
      const cacheKey = `analysis_${provider}_${inputValue}_${model}`
      const cacheData = JSON.stringify({ analysis: fullContent, reasoning: fullReasoning })
      localStorage.setItem(cacheKey, cacheData)
    } catch {
      setAnalysis("")
      setReasoning("")
    } finally {
      setALoading(false)
      analysisInProgressRef.current = false
    }
  }

  function saveSettings() {
    localStorage.setItem("ai_base_url", baseUrl)
    localStorage.setItem("ai_api_key", apiKey)
    localStorage.setItem("ai_model", model)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl py-10 px-6">
        {/* <h1 className="text-2xl font-semibold mb-6">AI 歌词赏析</h1> */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm">平台</label>
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="netease">网易云音乐</SelectItem>
                <SelectItem value="tencent">QQ 音乐</SelectItem>
                <SelectItem value="kugou">酷狗音乐</SelectItem>
                <SelectItem value="kuwo">酷我音乐</SelectItem>
                <SelectItem value="baidu">百度音乐</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm">歌曲链接或 ID</label>
            <div className="flex gap-2">
              <Input placeholder="https://music.163.com/song?id=... 或 y.qq.com/..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
              <Button onClick={fetchLyrics} disabled={loading}>获取歌词</Button>
            </div>
            {lyricError && (
              <p className="mt-2 text-sm text-red-600">{lyricError}</p>
            )}
          </div>
        </div>

        {lyrics && (
          <div className="grid grid-cols-1 gap-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">歌词</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm">显示翻译</span>
                  <Switch checked={showTranslation} onCheckedChange={setShowTranslation} />
                </div>
              </div>
              <div className="space-y-4">
                {coverUrl && (
                  <div className="flex items-start gap-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={coverUrl} 
                      alt="专辑封面" 
                      className="w-24 h-24 object-cover rounded shadow-md"
                    />
                    {songInfo && (
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{songInfo.name}</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {songInfo.artist.join(" / ")}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500">
                          {songInfo.album}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <LyricsRenderer lyrics={lyrics} showTranslation={showTranslation} showTimestamp={true} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium mb-2">AI 赏析</h2>
              <div className="space-y-2">
                <AIConfig
                  baseUrl={baseUrl}
                  apiKey={apiKey}
                  model={model}
                  onBaseUrlChange={setBaseUrl}
                  onApiKeyChange={setApiKey}
                  onModelChange={setModel}
                  onSave={saveSettings}
                  onAnalyze={analyze}
                  loading={aLoading}
                />
                {reasoning && (
                  <div className="border rounded-md bg-amber-50 dark:bg-amber-950/30">
                    <button 
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">思考过程</h3>
                      <span className="text-amber-800 dark:text-amber-300">
                        {showReasoning ? "▼" : "▶"}
                      </span>
                    </button>
                    {showReasoning && (
                      <div className="px-4 pb-4 prose prose-zinc dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkCjkFriendly]} 
                        >
                          {reasoning}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                <div className="min-h-40 p-4 border rounded-md bg-white dark:bg-zinc-950 prose prose-zinc dark:prose-invert max-w-none">
                  {analysis ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkCjkFriendly]} 
                    >
                      {analysis}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">将在此显示 AI 赏析</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!lyrics && (
          <p className="mt-6 text-sm text-zinc-600">请输入歌曲链接或 ID，然后点击获取歌词。</p>
        )}
      </main>
    </div>
  )
}

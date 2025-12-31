"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkCjkFriendly from "remark-cjk-friendly"
import type { Lyrics } from "@/lib/lyrics"

export interface SongInfo {
  name: string
  artist: string[]
  album?: string
}

interface AIAnalysisProps {
  lyrics: Lyrics | null
  plainText: string
  songInfo: SongInfo | null
  urlId: string
  urlProvider: string
  provider: string
  model: string
  baseUrl: string
  apiKey: string
  title: string
  promptGenerator: (lyrics: string, songName?: string, artist?: string) => string
  cacheKeyPrefix: string
  systemPrompt?: string
}

export function AIAnalysis({
  lyrics,
  plainText,
  songInfo,
  urlId,
  urlProvider,
  provider,
  model,
  baseUrl,
  apiKey,
  title,
  promptGenerator,
  cacheKeyPrefix,
  systemPrompt = "你是一位资深的语言和文学专家"
}: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [loading, setLoading] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const analysisInProgressRef = useRef(false)

  // Load cached analysis when component mounts or dependencies change
  useEffect(() => {
    if (lyrics && urlId) {
      const cacheKey = `${cacheKeyPrefix}_${urlProvider || provider}_${urlId}_${model}`
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
  }, [lyrics, urlId, urlProvider, provider, model, cacheKeyPrefix])

  // Reset showReasoning when reasoning changes and not in progress
  useEffect(() => {
    if (!analysisInProgressRef.current && reasoning) {
      setShowReasoning(false)
    }
  }, [reasoning])

  async function analyze() {
    if (!lyrics) return
    setLoading(true)
    analysisInProgressRef.current = true
    setAnalysis("")
    setReasoning("")
    
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptGenerator(plainText, songInfo?.name, songInfo?.artist?.join(" / ")) },
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
                // Ignore parse errors
              }
            }
          }
        }
      }
      
      const cacheKey = `${cacheKeyPrefix}_${urlProvider || provider}_${urlId}_${model}`
      const cacheData = JSON.stringify({ analysis: fullContent, reasoning: fullReasoning })
      localStorage.setItem(cacheKey, cacheData)
    } catch {
      setAnalysis("")
      setReasoning("")
    } finally {
      setLoading(false)
      analysisInProgressRef.current = false
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <Link href="/ai-config">
          <Button variant="outline" size="sm">配置 AI</Button>
        </Link>
      </div>
      <div className="space-y-2">
        {baseUrl && apiKey && model ? (
          <>
            <Button 
              onClick={analyze} 
              disabled={loading || !lyrics}
              className="w-full"
            >
              {loading ? "生成中..." : "生成分析"}
            </Button>
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
                <p className="text-zinc-500 dark:text-zinc-400">将在此显示分析结果</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
            <p className="text-sm">请先配置 AI 设置以使用分析功能</p>
          </div>
        )}
      </div>
    </div>
  )
}

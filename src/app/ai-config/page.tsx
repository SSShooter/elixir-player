"use client"
import { useEffect, useState } from "react"
import { NavMenu } from "@/components/nav-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function AIConfigContent() {
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [models, setModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [modelError, setModelError] = useState("")
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load AI settings from localStorage
  useEffect(() => {
    const u = localStorage.getItem("ai_base_url")
    const k = localStorage.getItem("ai_api_key")
    const m = localStorage.getItem("ai_model")
    if (u) setBaseUrl(u)
    if (k) setApiKey(k)
    if (m) setModel(m)
  }, [])

  // Fetch models when baseUrl or apiKey changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (baseUrl && apiKey) {
        fetchModels()
      } else {
        setModels([])
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [baseUrl, apiKey])

  async function fetchModels() {
    if (!baseUrl || !apiKey) {
      setModels([])
      return
    }

    setFetchingModels(true)
    setModelError("")
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "获取模型列表失败")
      }
      const modelList = data.data?.map((m: { id: string }) => m.id) || []
      setModels(modelList)
      if (modelList.length > 0 && !modelList.includes(model)) {
        setModel(modelList[0])
      }
    } catch (e) {
      setModels([])
      setModelError(e instanceof Error ? e.message : "获取模型列表失败")
    } finally {
      setFetchingModels(false)
    }
  }

  function saveSettings() {
    localStorage.setItem("ai_base_url", baseUrl)
    localStorage.setItem("ai_api_key", apiKey)
    localStorage.setItem("ai_model", model)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl py-6 md:py-10 px-4 md:px-6">
        <NavMenu />
        
        <div className="mt-6">
          <h1 className="text-2xl font-bold mb-2">AI 配置</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            配置 OpenAI 兼容的 API 端点，用于歌词 AI 赏析功能
          </p>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-2">API Base URL</label>
              <Input 
                placeholder="https://api.openai.com/v1" 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <Input 
                type="password"
                placeholder="sk-..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">模型</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={fetchingModels}
                  >
                    {fetchingModels ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        <span>获取模型中...</span>
                      </div>
                    ) : !models.length ? (
                      <span className="text-zinc-500">{modelError || "请输入 URL 和 API Key"}</span>
                    ) : (
                      model || "选择模型"
                    )}
                    {!fetchingModels && models.length > 0 && (
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                {models.length > 0 && (
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="搜索模型..." />
                      <CommandList>
                        <CommandEmpty>未找到模型</CommandEmpty>
                        <CommandGroup>
                          {models.map((m) => (
                            <CommandItem
                              key={m}
                              value={m}
                              onSelect={(currentValue) => {
                                setModel(currentValue === model ? "" : currentValue)
                                setOpen(false)
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  model === m ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {m}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={saveSettings} disabled={!baseUrl || !apiKey || !model}>
                {saved ? "已保存 ✓" : "保存配置"}
              </Button>
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  配置已保存到本地
                </p>
              )}
            </div>

            <div className="mt-8 p-4 border rounded-md bg-blue-50 dark:bg-blue-950/30">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">使用说明</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>配置保存后，在播放器页面可以使用 AI 赏析功能</li>
                <li>支持任何 OpenAI 兼容的 API 端点</li>
                <li>配置信息仅保存在浏览器本地，不会上传到服务器</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AIConfigPage() {
  return <AIConfigContent />
}

"use client"
import { useEffect, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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

interface AIConfigProps {
  baseUrl: string
  apiKey: string
  model: string
  onBaseUrlChange: (value: string) => void
  onApiKeyChange: (value: string) => void
  onModelChange: (value: string) => void
  onSave: () => void
  onAnalyze: () => void
  loading: boolean
}

export default function AIConfig({
  baseUrl,
  apiKey,
  model,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
  onSave,
  onAnalyze,
  loading
}: AIConfigProps) {
  const [models, setModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [modelError, setModelError] = useState("")
  const [open, setOpen] = useState(false)

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
        onModelChange(modelList[0])
      }
    } catch (e) {
      setModels([])
      setModelError(e instanceof Error ? e.message : "获取模型列表失败")
    } finally {
      setFetchingModels(false)
    }
  }

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

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="OpenAI Base URL" value={baseUrl} onChange={(e) => onBaseUrlChange(e.target.value)} />
        <Input placeholder="API Key" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} />
      </div>
      <div>
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
                          onModelChange(currentValue === model ? "" : currentValue)
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
      <div className="flex gap-2">
        <Button variant="outline" onClick={onSave}>保存设置</Button>
        <Button onClick={onAnalyze} disabled={loading || !baseUrl || !apiKey || !model}>生成赏析</Button>
      </div>
    </div>
  )
}

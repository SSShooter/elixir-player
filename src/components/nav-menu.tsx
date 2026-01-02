"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function NavMenu() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 mb-6">
      <Link href="/search">
        <Button variant={pathname === "/search" ? "default" : "secondary"} size="sm">
          歌曲搜索
        </Button>
      </Link>
      <Link href="/playlist">
        <Button variant={pathname === "/playlist" ? "default" : "secondary"} size="sm">
          歌单查找
        </Button>
      </Link>
      <Link href="/share">
        <Button variant={pathname === "/share" ? "default" : "secondary"} size="sm">
          歌单分享
        </Button>
      </Link>
      <Link href="/">
        <Button variant={pathname === "/" ? "default" : "secondary"} size="sm">
          播放器
        </Button>
      </Link>
      <Link href="/ai-config">
        <Button variant={pathname === "/ai-config" ? "default" : "secondary"} size="sm">
          设置
        </Button>
      </Link>
    </div>
  )
}

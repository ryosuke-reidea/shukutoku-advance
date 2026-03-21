'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function ScrollToTop() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirst = useRef(true)

  useEffect(() => {
    // 初回レンダリングではスキップ（リロード時はブラウザが処理する）
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    // クライアントナビゲーション時に即座にトップへスクロール
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, searchParams])

  return null
}

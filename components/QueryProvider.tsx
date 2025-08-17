'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // 在客户端组件中创建 QueryClient 实例
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
            gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
            retry: 1,
            refetchOnWindowFocus: false, // 避免窗口聚焦时重新获取
            refetchOnReconnect: true, // 网络重连时重新获取
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

import { useQuery } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"

interface Stats {
  totalApplications: number
  activeInterviews: number
  offersReceived: number
  favorites: number
  appliedCount: number
  rejectedCount: number
  acceptedCount: number
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => DataService.fetchStats(),
    staleTime: 5 * 60 * 1000, // 5分钟缓存 - 统计数据不需要实时更新
    enabled: true,
  })
}
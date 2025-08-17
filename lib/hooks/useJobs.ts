import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"
import type { Job } from "@/lib/types"

interface UseJobsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  favorites?: boolean
}

export function useJobs(params: UseJobsParams = {}) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => DataService.fetchJobs(params),
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    enabled: true, // 总是启用查询
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobData: Partial<Job>) => DataService.createJob(jobData),
    onSuccess: () => {
      // 创建成功后刷新jobs列表
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      queryClient.invalidateQueries({ queryKey: ["job-events"] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: number; updates: Partial<Job> }) => DataService.updateJob(jobId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: number) => DataService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      queryClient.invalidateQueries({ queryKey: ["job-events"] })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, isFavorite }: { jobId: number; isFavorite: boolean }) =>
      DataService.toggleFavorite(jobId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"
import type { JobEvent } from "@/lib/types"

export function useJobEvents(jobId?: number) {
  return useQuery({
    queryKey: ["job-events", jobId],
    queryFn: () => DataService.fetchJobEvents(jobId),
    staleTime: 1 * 60 * 1000, // 1分钟缓存
  })
}

export function useCreateJobEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventData: Partial<JobEvent>) => DataService.createJobEvent(eventData),
    onSuccess: (_, variables) => {
      // 刷新相关的查询
      queryClient.invalidateQueries({ queryKey: ["job-events"] })
      queryClient.invalidateQueries({ queryKey: ["job-events", variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] }) // 因为job状态可能改变
    },
  })
}

export function useUpdateJobEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, updates }: { eventId: number; updates: Partial<JobEvent> }) =>
      DataService.updateJobEvent(eventId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-events"] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })
}

export function useDeleteJobEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: number) => DataService.deleteJobEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-events"] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })
}

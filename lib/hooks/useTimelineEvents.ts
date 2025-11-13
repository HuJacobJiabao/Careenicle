import { useInfiniteQuery } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"
import type { JobEvent } from "@/lib/types"

export interface TimelineEventDisplay {
  id: string
  type: string
  company: string
  position: string
  date: Date
  eventType: JobEvent["eventType"]
  location?: string
  priority: number
  side: "left" | "right"
  interviewType?: string
  interviewRound?: number
}

interface TimelineEventsResponse {
  events: Array<{
    id: number
    jobId: number
    company: string
    position: string
    location?: string
    eventType: string
    eventDate: string
    interviewRound?: number
    interviewType?: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export function useTimelineEvents(pageSize: number = 50) {
  return useInfiniteQuery({
    queryKey: ["timeline-events", pageSize],
    queryFn: async ({ pageParam = 1 }): Promise<TimelineEventsResponse> => {
      // Check database provider
      const provider = await DataService.getDatabaseProvider()

      if (provider === "mock") {
        // Fallback to old implementation for mock data
        return fetchMockTimelineEvents(pageParam, pageSize)
      } else if (provider === "supabase") {
        // Use Supabase service
        const { SupabaseService } = await import("@/lib/supabaseService")
        return await SupabaseService.fetchTimelineEvents({
          page: pageParam,
          limit: pageSize,
        })
      } else {
        // Fetch from PostgreSQL API endpoint
        const response = await fetch(`/api/timeline-events?page=${pageParam}&limit=${pageSize}`)
        if (!response.ok) {
          throw new Error("Failed to fetch timeline events")
        }
        return await response.json()
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Fallback function for mock data (preserves old behavior)
async function fetchMockTimelineEvents(page: number, limit: number): Promise<TimelineEventsResponse> {
  const jobsData = await DataService.fetchJobs({ limit: 1000 })
  const jobs = jobsData.jobs || []

  const allEvents: Array<{
    id: number
    jobId: number
    company: string
    position: string
    location?: string
    eventType: string
    eventDate: string
    interviewRound?: number
    interviewType?: string
  }> = []

  // Process each job and its events
  for (const job of jobs) {
    if (!job.id) continue
    const jobEvents = await DataService.fetchJobEvents(job.id)

    jobEvents.forEach((event) => {
      const allowedEvents = ["applied", "interview", "rejected", "offer_received", "offer_accepted"]
      if (!allowedEvents.includes(event.eventType)) return

      allEvents.push({
        id: event.id!,
        jobId: job.id!,
        company: job.company,
        position: job.position,
        location: job.location,
        eventType: event.eventType,
        eventDate: event.eventDate.toISOString(),
        interviewRound: event.interviewRound,
        interviewType: event.interviewType,
      })
    })
  }

  // Sort by date (newest first)
  allEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

  // Apply pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedEvents = allEvents.slice(startIndex, endIndex)

  return {
    events: paginatedEvents,
    pagination: {
      page,
      limit,
      total: allEvents.length,
      totalPages: Math.ceil(allEvents.length / limit),
      hasMore: endIndex < allEvents.length,
    },
  }
}

// Transform API response to display format
export function transformToDisplayEvents(
  events: TimelineEventsResponse["events"],
): TimelineEventDisplay[] {
  return events.map((event) => ({
    id: `event-${event.id}`,
    type: event.eventType,
    company: event.company,
    position: event.position,
    date: new Date(event.eventDate),
    eventType: event.eventType as JobEvent["eventType"],
    location: event.location,
    priority: getEventPriority(event.eventType as JobEvent["eventType"]),
    side: getEventSide(event.eventType as JobEvent["eventType"]),
    interviewType: event.interviewType,
    interviewRound: event.interviewRound,
  }))
}

// Helper functions
function getEventPriority(eventType: JobEvent["eventType"]): number {
  const priorities: Record<string, number> = {
    offer_accepted: 10,
    offer_received: 9,
    rejected: 8,
    interview: 7,
    applied: 6,
  }
  return priorities[eventType] || 1
}

function getEventSide(eventType: JobEvent["eventType"]): "left" | "right" {
  const leftSideEvents = ["rejected", "offer_received", "offer_accepted"]
  return leftSideEvents.includes(eventType) ? "left" : "right"
}

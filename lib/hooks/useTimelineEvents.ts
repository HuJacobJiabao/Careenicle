import { useQuery } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"
import type { Job, JobEvent } from "@/lib/types"

interface TimelineEventDisplay {
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

export function useTimelineEvents() {
  return useQuery({
    queryKey: ["timeline-events"],
    queryFn: async (): Promise<TimelineEventDisplay[]> => {
      // Fetch jobs data
      const jobsData = await DataService.fetchJobs({ limit: 1000 })
      const jobs: Job[] = jobsData.jobs || []

      const events: TimelineEventDisplay[] = []

      // Process each job and its events
      for (const job of jobs) {
        if (!job.id) continue
        const jobEvents = await DataService.fetchJobEvents(job.id)

        jobEvents.forEach((event: JobEvent) => {
          // Only include specified event types
          const allowedEvents: JobEvent["eventType"][] = [
            "applied",
            "interview",
            "rejected",
            "offer_received",
            "offer_accepted",
          ]

          if (!allowedEvents.includes(event.eventType)) return

          const priority = getEventPriority(event.eventType)
          const side = getEventSide(event.eventType)

          events.push({
            id: `event-${event.id}`,
            type: event.eventType,
            company: job.company,
            position: job.position,
            date: new Date(event.eventDate),
            eventType: event.eventType,
            location: job.location,
            priority,
            side,
            interviewType: event.interviewType,
            interviewRound: event.interviewRound,
          })
        })
      }

      // Sort by date (newest first)
      events.sort((a, b) => b.date.getTime() - a.date.getTime())
      return events
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
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

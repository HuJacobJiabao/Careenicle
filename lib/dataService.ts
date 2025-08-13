import type { Job, JobEvent } from "./types"
import { mockJobs, mockJobEvents } from "./mockData"

export type DatabaseProvider = "mock" | "postgresql" | "supabase"

export class DataService {
  private static databaseProvider: DatabaseProvider = "mock"

  static setDatabaseProvider(provider: DatabaseProvider) {
    this.databaseProvider = provider
    if (typeof window !== "undefined") {
      localStorage.setItem("databaseProvider", provider)
    }
  }

  static getDatabaseProvider(): DatabaseProvider {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("databaseProvider") as DatabaseProvider
      if (stored && ["mock", "postgresql", "supabase"].includes(stored)) {
        this.databaseProvider = stored
      }
    }
    return this.databaseProvider
  }

  static setUseMockData(useMock: boolean) {
    this.setDatabaseProvider(useMock ? "mock" : "postgresql")
  }

  static getUseMockData(): boolean {
    return this.getDatabaseProvider() === "mock"
  }

  static async fetchJobs(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    favorites?: boolean
  }): Promise<{ jobs: Job[]; pagination?: any }> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      let filteredJobs = [...mockJobs]

      // Apply filters
      if (params?.search) {
        const searchLower = params.search.toLowerCase()
        filteredJobs = filteredJobs.filter(
          (job) => job.company.toLowerCase().includes(searchLower) || job.position.toLowerCase().includes(searchLower),
        )
      }

      if (params?.status && params.status !== "all") {
        filteredJobs = filteredJobs.filter((job) => job.status === params.status)
      }

      if (params?.favorites) {
        filteredJobs = filteredJobs.filter((job) => job.isFavorite)
      }

      // Apply pagination
      const page = params?.page || 1
      const limit = params?.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

      return {
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          total: filteredJobs.length,
          totalPages: Math.ceil(filteredJobs.length / limit),
        },
      }
    } else {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.search) searchParams.set("search", params.search)
      if (params?.status) searchParams.set("status", params.status)
      if (params?.favorites) searchParams.set("favorites", params.favorites.toString())

      searchParams.set("provider", provider)

      const response = await fetch(`/api/jobs?${searchParams}`)
      return await response.json()
    }
  }

  static async fetchInterviews(jobId?: number): Promise<JobEvent[]> {
    // This method is deprecated - use fetchJobEvents instead
    return this.fetchJobEvents(jobId)
  }

  static async createJob(jobData: Partial<Job>): Promise<Job> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const newJob: Job = {
        id: Math.max(...mockJobs.map((j) => j.id!)) + 1,
        company: jobData.company!,
        position: jobData.position!,
        jobUrl: jobData.jobUrl,
        applicationDate: jobData.applicationDate!,
        status: jobData.status || "applied",
        location: jobData.location,
        notes: jobData.notes,
        isFavorite: jobData.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockJobs.unshift(newJob)
      return newJob
    } else {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...jobData, provider }),
      })
      return await response.json()
    }
  }

  static async updateJob(jobId: number, updates: Partial<Job>): Promise<void> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...updates, updatedAt: new Date() }
      }
    } else {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, provider }),
      })
    }
  }

  static async deleteJob(jobId: number): Promise<void> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs.splice(jobIndex, 1)
      }
    } else {
      await fetch(`/api/jobs/${jobId}?provider=${provider}`, { method: "DELETE" })
    }
  }

  static async fetchJobEvents(jobId?: number): Promise<JobEvent[]> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      let events = [...mockJobEvents]

      if (jobId) {
        events = events.filter((event) => event.jobId === jobId)
      }

      return events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    } else {
      const params = new URLSearchParams()
      if (jobId) params.set("jobId", jobId.toString())
      params.set("provider", provider)

      const response = await fetch(`/api/job-events?${params}`)
      return await response.json()
    }
  }

  static async createJobEvent(eventData: Partial<JobEvent>): Promise<JobEvent> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const newEvent: JobEvent = {
        id: Math.max(...mockJobEvents.map((e) => e.id!)) + 1,
        jobId: eventData.jobId!,
        eventType: eventData.eventType!,
        eventDate: eventData.eventDate!,
        title: eventData.title!,
        description: eventData.description,
        interviewRound: eventData.interviewRound,
        interviewType: eventData.interviewType,
        interviewLink: eventData.interviewLink,
        interviewResult: eventData.interviewResult,
        notes: eventData.notes,
        metadata: eventData.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockJobEvents.unshift(newEvent)
      return newEvent
    } else {
      const response = await fetch("/api/job-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...eventData, provider }),
      })
      return await response.json()
    }
  }

  static async updateJobEvent(eventId: number, updates: Partial<JobEvent>): Promise<void> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const eventIndex = mockJobEvents.findIndex((event) => event.id === eventId)
      if (eventIndex !== -1) {
        mockJobEvents[eventIndex] = { ...mockJobEvents[eventIndex], ...updates, updatedAt: new Date() }
      }
    } else {
      await fetch(`/api/job-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, provider }),
      })
    }
  }

  static async deleteJobEvent(eventId: number): Promise<void> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const eventIndex = mockJobEvents.findIndex((event) => event.id === eventId)
      if (eventIndex !== -1) {
        mockJobEvents.splice(eventIndex, 1)
      }
    } else {
      await fetch(`/api/job-events/${eventId}?provider=${provider}`, { method: "DELETE" })
    }
  }

  static async toggleFavorite(jobId: number, isFavorite: boolean): Promise<void> {
    const provider = this.getDatabaseProvider()

    if (provider === "mock") {
      const job = mockJobs.find((job) => job.id === jobId)
      if (job) {
        job.isFavorite = !isFavorite
        job.updatedAt = new Date()
      }
    } else {
      await fetch(`/api/jobs/${jobId}/favorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite, provider }),
      })
    }
  }
}

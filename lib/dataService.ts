import type { Job, JobEvent } from "./types"
import { mockJobs, mockJobEvents } from "./mockData"
import { SupabaseService } from "./supabaseService"
import { supabase } from "./supabase/client"

interface Stats {
  totalApplications: number
  activeInterviews: number
  offersReceived: number
  favorites: number
  appliedCount: number
  rejectedCount: number
  acceptedCount: number
}

export type DatabaseProvider = "mock" | "postgresql" | "supabase"

const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return !!session?.user
  } catch {
    return false
  }
}

export class DataService {
  private static databaseProvider: DatabaseProvider = "mock"

  // Get the configured database provider from environment
  static getConfiguredProvider(): DatabaseProvider {
    const envProvider = process.env.NEXT_PUBLIC_DATABASE_PROVIDER as DatabaseProvider
    if (envProvider && ["mock", "postgresql", "supabase"].includes(envProvider)) {
      // console.log(`Using configured database provider: ${envProvider}`)
      return envProvider
    }
    return "mock" // default fallback
  }

  // Get available providers based on environment configuration
  static getAvailableProviders(): DatabaseProvider[] {
    const configuredProvider = this.getConfiguredProvider()

    switch (configuredProvider) {
      case "supabase":
        return ["mock", "supabase"] // Only show mock and supabase options
      case "postgresql":
        return ["mock", "postgresql"] // Only show mock and postgresql options
      default:
        return ["mock", "postgresql", "supabase"] // Show all options for development
    }
  }

  static async setDatabaseProvider(provider: DatabaseProvider) {
    // Check if user is authenticated - if so, force Supabase
    const isAuthenticated = await isUserAuthenticated()
    if (isAuthenticated && provider !== "supabase") {
      console.warn("User is authenticated - forcing Supabase provider")
      provider = "supabase"
    }

    const availableProviders = this.getAvailableProviders()
    if (!availableProviders.includes(provider)) {
      console.warn(`Provider ${provider} is not available in current configuration`)
      return
    }

    this.databaseProvider = provider
    // Delay saving to localStorage to avoid hydration errors
    if (typeof window !== "undefined") {
      setTimeout(() => {
        localStorage.setItem("databaseProvider", provider)
      }, 0)
    }
  }

  static async getDatabaseProvider(): Promise<DatabaseProvider> {
    // Check if user is authenticated first
    const isAuthenticated = await isUserAuthenticated()
    if (isAuthenticated) {
      this.databaseProvider = "supabase"
      if (typeof window !== "undefined") {
        localStorage.setItem("databaseProvider", "supabase")
      }
      return "supabase"
    }

    // If already set, return directly
    if (this.databaseProvider !== "mock") {
      return this.databaseProvider
    }

    // Only try to read from localStorage on the client side
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("databaseProvider") as DatabaseProvider
        if (stored && this.getAvailableProviders().includes(stored)) {
          this.databaseProvider = stored
          return stored
        }
      } catch (error) {
        console.warn("Failed to read from localStorage:", error)
      }
    }

    // Fallback to the configured provider
    const configuredProvider = this.getConfiguredProvider()
    this.databaseProvider = configuredProvider
    return configuredProvider
  }

  static async setUseMockData(useMock: boolean) {
    // Check if user is authenticated - if so, prevent switching to mock data
    const isAuthenticated = await isUserAuthenticated()
    if (isAuthenticated && useMock) {
      console.warn("User is authenticated - cannot switch to mock data")
      return
    }

    const availableProviders = this.getAvailableProviders()
    if (useMock) {
      await this.setDatabaseProvider("mock")
    } else {
      // Choose the first non-mock provider available
      const nonMockProvider = availableProviders.find((p) => p !== "mock")
      if (nonMockProvider) {
        await this.setDatabaseProvider(nonMockProvider)
      }
    }
  }

  static async getUseMockData(): Promise<boolean> {
    const provider = await this.getDatabaseProvider()
    return provider === "mock"
  }

  static async fetchJobs(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    favorites?: boolean
  }): Promise<{ jobs: Job[]; pagination?: any }> {
    const provider = await this.getDatabaseProvider()

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
    } else if (provider === "supabase") {
      // Use Supabase with pagination
      return await SupabaseService.fetchJobs(params)
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
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      const newJob: Job = {
        id: Math.max(...mockJobs.map((j) => j.id!)) + 1,
        company: jobData.company!,
        position: jobData.position!,
        jobUrl: jobData.jobUrl,
        applicationDate: jobData.applicationDate!,
        status: jobData.status || "applied",
        location: jobData.location,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
        formatted_address: jobData.formatted_address,
        place_id: jobData.place_id,
        notes: jobData.notes,
        isFavorite: jobData.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockJobs.unshift(newJob)
      return newJob
    } else if (provider === "supabase") {
      return await SupabaseService.createJob({
        company: jobData.company!,
        position: jobData.position!,
        jobUrl: jobData.jobUrl,
        applicationDate: jobData.applicationDate!,
        status: jobData.status || "applied",
        location: jobData.location,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
        formatted_address: jobData.formatted_address,
        place_id: jobData.place_id,
        notes: jobData.notes,
        isFavorite: jobData.isFavorite || false,
      })
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
    const provider = await this.getDatabaseProvider()

    // If status is being updated, handle status change events BEFORE updating
    if (updates.status) {
      await this.handleStatusChangeEvents(jobId, updates.status, provider)
    }

    // Now update the job
    if (provider === "mock") {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...updates, updatedAt: new Date() }
      }
    } else if (provider === "supabase") {
      await SupabaseService.updateJob(jobId, updates)
    } else {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, provider }),
      })
    }
  }

  // Handle status change events based on the rules
  private static async handleStatusChangeEvents(jobId: number, newStatus: Job["status"], provider: DatabaseProvider): Promise<void> {
    // Get current job to determine old status
    const currentJob = await this.getCurrentJob(jobId, provider)
    if (!currentJob || currentJob.status === newStatus) {
      return // No change needed
    }

    const oldStatus = currentJob.status
    const eventsToDelete: string[] = []
    let eventToCreate: { type: string; title: string; description: string } | null = null

    // Determine which events to delete and create based on status transition
    switch (newStatus) {
      case "applied":
      case "interview":
        // Only delete result events, don't create new ones
        eventsToDelete.push("rejected", "offer_received", "offer_accepted")
        break

      case "rejected":
        // Delete offer/accepted events, create rejected event
        eventsToDelete.push("offer_received", "offer_accepted")
        eventToCreate = {
          type: "rejected",
          title: `Application rejected by ${currentJob.company}`,
          description: `Unfortunately, your application for ${currentJob.position} at ${currentJob.company} was rejected.`
        }
        break

      case "offer":
        // Delete rejected/accepted events, create offer event
        eventsToDelete.push("rejected", "offer_accepted")
        eventToCreate = {
          type: "offer_received", 
          title: `Job offer received from ${currentJob.company}`,
          description: `Congratulations! You received a job offer for ${currentJob.position} at ${currentJob.company}.`
        }
        break

      case "accepted":
        // Delete rejected events, create accepted event
        // Keep offer_received event if transitioning from offer
        if (oldStatus !== "offer") {
          eventsToDelete.push("rejected", "offer_received")
        } else {
          eventsToDelete.push("rejected")
        }
        eventToCreate = {
          type: "offer_accepted",
          title: `Job offer accepted at ${currentJob.company}`,
          description: `You accepted the job offer for ${currentJob.position} at ${currentJob.company}. Congratulations!`
        }
        break
    }

    // Delete old events
    if (eventsToDelete.length > 0) {
      await this.deleteJobEventsByType(jobId, eventsToDelete, provider)
    }

    // Create new event if needed
    if (eventToCreate) {
      await this.createJobEvent({
        jobId: jobId,
        eventType: eventToCreate.type as JobEvent["eventType"],
        eventDate: new Date(),
        title: eventToCreate.title,
        description: eventToCreate.description,
      })
    }
  }

  // Helper function to get current job
  private static async getCurrentJob(jobId: number, provider: DatabaseProvider): Promise<Job | null> {
    if (provider === "mock") {
      return mockJobs.find(job => job.id === jobId) || null
    } else if (provider === "supabase") {
      return await SupabaseService.getJobById(jobId)
    } else {
      const response = await fetch(`/api/jobs/${jobId}?provider=${provider}`)
      if (response.ok) {
        return await response.json()
      }
      return null
    }
  }

  // Helper function to delete job events by type
  private static async deleteJobEventsByType(jobId: number, eventTypes: string[], provider: DatabaseProvider): Promise<void> {
    if (provider === "mock") {
      // Remove events from mock data
      for (let i = mockJobEvents.length - 1; i >= 0; i--) {
        const event = mockJobEvents[i]
        if (event.jobId === jobId && eventTypes.includes(event.eventType)) {
          mockJobEvents.splice(i, 1)
        }
      }
    } else if (provider === "supabase") {
      await SupabaseService.deleteJobEventsByType(jobId, eventTypes)
    } else {
      // Call API to delete events
      await fetch(`/api/job-events/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, eventTypes, provider })
      })
    }
  }

  static async deleteJob(jobId: number): Promise<void> {
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs.splice(jobIndex, 1)
      }
    } else if (provider === "supabase") {
      await SupabaseService.deleteJob(jobId)
    } else {
      await fetch(`/api/jobs/${jobId}?provider=${provider}`, { method: "DELETE" })
    }
  }

  static async fetchJobEvents(jobId?: number): Promise<JobEvent[]> {
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      let events = [...mockJobEvents]

      if (jobId) {
        events = events.filter((event) => event.jobId === jobId)
      }

      return events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    } else if (provider === "supabase") {
      return await SupabaseService.fetchJobEvents(jobId)
    } else {
      const params = new URLSearchParams()
      if (jobId) params.set("jobId", jobId.toString())
      params.set("provider", provider)

      const response = await fetch(`/api/job-events?${params}`)
      return await response.json()
    }
  }

  static async createJobEvent(eventData: Partial<JobEvent>): Promise<JobEvent> {
    const provider = await this.getDatabaseProvider()

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

      const job = mockJobs.find((j) => j.id === eventData.jobId)
      if (job) {
        switch (eventData.eventType) {
          case "interview_scheduled":
          case "interview":
            job.status = "interview"
            break
          case "rejected":
            job.status = "rejected"
            break
          case "offer_received":
            job.status = "offer"
            break
          case "offer_accepted":
            job.status = "accepted"
            break
          case "interview_result":
            if (eventData.interviewResult === "failed") {
              // Check if this is the latest interview result
              const jobEvents = mockJobEvents
                .filter(
                  (e) =>
                    e.jobId === eventData.jobId &&
                    (e.eventType === "interview" || e.eventType === "interview_result") &&
                    e.interviewResult,
                )
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

              if (jobEvents.length > 0 && jobEvents[0].interviewResult === "failed") {
                job.status = "rejected"
              }
            }
            break
        }
        job.updatedAt = new Date()
      }

      return newEvent
    } else if (provider === "supabase") {
      return await SupabaseService.createJobEvent({
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
      })
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
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      const eventIndex = mockJobEvents.findIndex((event) => event.id === eventId)
      if (eventIndex !== -1) {
        mockJobEvents[eventIndex] = { ...mockJobEvents[eventIndex], ...updates, updatedAt: new Date() }
      }
    } else if (provider === "supabase") {
      await SupabaseService.updateJobEvent(eventId, updates)
    } else {
      await fetch(`/api/job-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, provider }),
      })
    }
  }

  static async deleteJobEvent(eventId: number): Promise<void> {
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      const eventIndex = mockJobEvents.findIndex((event) => event.id === eventId)
      if (eventIndex !== -1) {
        mockJobEvents.splice(eventIndex, 1)
      }
    } else if (provider === "supabase") {
      await SupabaseService.deleteJobEvent(eventId)
    } else {
      await fetch(`/api/job-events/${eventId}?provider=${provider}`, { method: "DELETE" })
    }
  }

  static async toggleFavorite(jobId: number, isFavorite: boolean): Promise<void> {
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      const job = mockJobs.find((job) => job.id === jobId)
      if (job) {
        job.isFavorite = !isFavorite
        job.updatedAt = new Date()
      }
    } else if (provider === "supabase") {
      await SupabaseService.toggleFavorite(jobId)
    } else {
      await fetch(`/api/jobs/${jobId}/favorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite, provider }),
      })
    }
  }

  static async fetchStats(): Promise<Stats> {
    const provider = await this.getDatabaseProvider()

    if (provider === "mock") {
      // Calculate stats from mock data
      const stats: Stats = {
        totalApplications: mockJobs.length,
        activeInterviews: mockJobs.filter(job => job.status === "interview").length,
        offersReceived: mockJobs.filter(job => job.status === "offer").length,
        favorites: mockJobs.filter(job => job.isFavorite === true).length,
        appliedCount: mockJobs.filter(job => job.status === "applied").length,
        rejectedCount: mockJobs.filter(job => job.status === "rejected").length,
        acceptedCount: mockJobs.filter(job => job.status === "accepted").length,
      }
      return stats
    } else if (provider === "supabase") {
      return await SupabaseService.fetchStats()
    } else {
      // Use PostgreSQL API
      const response = await fetch(`/api/stats?provider=${provider}`)
      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }
      return await response.json()
    }
  }
}

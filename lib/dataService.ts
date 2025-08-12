import type { Job, JobEvent } from "./types"
import { mockJobs, mockJobEvents } from "./mockData"

export class DataService {
  private static useMockData = false

  static setUseMockData(useMock: boolean) {
    this.useMockData = useMock
    if (typeof window !== "undefined") {
      localStorage.setItem("useMockData", useMock.toString())
    }
  }

  static getUseMockData(): boolean {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("useMockData")
      if (stored !== null) {
        this.useMockData = stored === "true"
      }
    }
    return this.useMockData
  }

  static async fetchJobs(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    favorites?: boolean
  }): Promise<{ jobs: Job[]; pagination?: any }> {
    if (this.useMockData) {
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
      // Real API call
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.search) searchParams.set("search", params.search)
      if (params?.status) searchParams.set("status", params.status)
      if (params?.favorites) searchParams.set("favorites", params.favorites.toString())

      const response = await fetch(`/api/jobs?${searchParams}`)
      return await response.json()
    }
  }

  static async fetchInterviews(jobId?: number): Promise<JobEvent[]> {
    // This method is deprecated - use fetchJobEvents instead
    return this.fetchJobEvents(jobId)
  }

  static async createJob(jobData: Partial<Job>): Promise<Job> {
    if (this.useMockData) {
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
        body: JSON.stringify(jobData),
      })
      return await response.json()
    }
  }

  static async updateJob(jobId: number, updates: Partial<Job>): Promise<void> {
    if (this.useMockData) {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...updates, updatedAt: new Date() }
      }
    } else {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    }
  }

  static async deleteJob(jobId: number): Promise<void> {
    if (this.useMockData) {
      const jobIndex = mockJobs.findIndex((job) => job.id === jobId)
      if (jobIndex !== -1) {
        mockJobs.splice(jobIndex, 1)
      }
    } else {
      await fetch(`/api/jobs/${jobId}`, { method: "DELETE" })
    }
  }

  static async fetchJobEvents(jobId?: number): Promise<JobEvent[]> {
    if (this.useMockData) {
      let events = [...mockJobEvents]

      if (jobId) {
        events = events.filter((event) => event.jobId === jobId)
      }

      return events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    } else {
      const params = jobId ? `?jobId=${jobId}` : ""
      const response = await fetch(`/api/job-events${params}`)
      return await response.json()
    }
  }

  static async toggleFavorite(jobId: number, isFavorite: boolean): Promise<void> {
    if (this.useMockData) {
      const job = mockJobs.find((job) => job.id === jobId)
      if (job) {
        job.isFavorite = !isFavorite
        job.updatedAt = new Date()
      }
    } else {
      await fetch(`/api/jobs/${jobId}/favorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      })
    }
  }
}

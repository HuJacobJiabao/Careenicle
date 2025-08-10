import type { Job, Interview } from "./types"
import { mockJobs, mockInterviews } from "./mockData"

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

  static async fetchInterviews(jobId?: number): Promise<Interview[]> {
    if (this.useMockData) {
      return jobId ? mockInterviews.filter((interview) => interview.jobId === jobId) : mockInterviews
    } else {
      const params = jobId ? `?jobId=${jobId}` : ""
      const response = await fetch(`/api/interviews${params}`)
      return await response.json()
    }
  }

  static async createJob(jobData: Partial<Job>): Promise<Job> {
    if (this.useMockData) {
      const newJob: Job = {
        id: Math.max(...mockJobs.map((j) => j.id!)) + 1,
        company: jobData.company!,
        position: jobData.position!,
        jobUrl: jobData.jobUrl!,
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
      // Also remove related interviews
      for (let i = mockInterviews.length - 1; i >= 0; i--) {
        if (mockInterviews[i].jobId === jobId) {
          mockInterviews.splice(i, 1)
        }
      }
    } else {
      await fetch(`/api/jobs/${jobId}`, { method: "DELETE" })
    }
  }

  static async fetchJobEvents(jobId: number): Promise<any[]> {
    if (this.useMockData) {
      // For mock mode, we'll return an empty array for now
      // In a real implementation, we would have mock job events
      return []
    } else {
      const response = await fetch(`/api/job-events?jobId=${jobId}`)
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

  static async createInterview(interviewData: Partial<Interview>): Promise<Interview> {
    if (this.useMockData) {
      const newInterview: Interview = {
        id: Math.max(...mockInterviews.map((i) => i.id!)) + 1,
        jobId: interviewData.jobId!,
        round: interviewData.round!,
        type: interviewData.type!,
        scheduledDate: interviewData.scheduledDate!,
        actualDate: interviewData.actualDate,
        duration: interviewData.duration,
        interviewer: interviewData.interviewer,
        result: interviewData.result || "pending",
        feedback: interviewData.feedback,
        notes: interviewData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockInterviews.push(newInterview)
      return newInterview
    } else {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interviewData),
      })
      return await response.json()
    }
  }

  static async updateInterview(interviewId: number, updates: Partial<Interview>): Promise<void> {
    if (this.useMockData) {
      const interviewIndex = mockInterviews.findIndex((interview) => interview.id === interviewId)
      if (interviewIndex !== -1) {
        mockInterviews[interviewIndex] = { ...mockInterviews[interviewIndex], ...updates, updatedAt: new Date() }
      }
    } else {
      await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    }
  }

  static async deleteInterview(interviewId: number): Promise<void> {
    if (this.useMockData) {
      const interviewIndex = mockInterviews.findIndex((interview) => interview.id === interviewId)
      if (interviewIndex !== -1) {
        mockInterviews.splice(interviewIndex, 1)
      }
    } else {
      await fetch(`/api/interviews/${interviewId}`, { method: "DELETE" })
    }
  }
}

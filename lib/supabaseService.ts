import { supabase, isSupabaseConfigured } from "./supabase/client"
import type { Job, JobEvent } from "./types"

export class SupabaseService {
  // Check if Supabase is configured before any operation
  private static checkConfiguration(): void {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not properly configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
      )
    }
  }

  // Get current user ID from Supabase auth
  private static async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error("User not authenticated")
    }

    return user.id
  }

  // Helper function to convert camelCase to snake_case for database
  private static toSnakeCase(obj: any): any {
    if (!obj || typeof obj !== "object") return obj
    if (obj instanceof Date) return obj
    if (Array.isArray(obj)) return obj.map(item => this.toSnakeCase(item))

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip non-serializable properties
      if (typeof value === 'function' || typeof value === 'symbol') continue
      
      // If the key already contains underscores, keep it as is
      // Otherwise, convert camelCase to snake_case
      const snakeKey = key.includes("_") ? key : key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      
      // Recursively convert nested objects, but avoid circular references
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        converted[snakeKey] = this.toSnakeCase(value)
      } else {
        converted[snakeKey] = value
      }
    }
    return converted
  }

  // Helper function to convert snake_case to camelCase from database
  private static toCamelCase(obj: any): any {
    if (!obj || typeof obj !== "object") return obj

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      converted[camelKey] = value
    }
    return converted
  }

  // Job operations
  static async fetchJobs(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    favorites?: boolean
  }): Promise<{ jobs: Job[]; pagination?: any }> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const page = params?.page || 1
    const limit = params?.limit || 10
    const offset = (page - 1) * limit

    let query = supabase.from("jobs").select("*", { count: "exact" }).eq("user_id", userId) // Filter by current user

    // Apply filters
    if (params?.search) {
      query = query.or(`company.ilike.%${params.search}%,position.ilike.%${params.search}%`)
    }

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status)
    }

    if (params?.favorites) {
      query = query.eq("is_favorite", true)
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching jobs from Supabase:", error)
      throw new Error("Failed to fetch jobs")
    }

    const total = count || 0

    return {
      jobs: (data || []).map((job) => this.toCamelCase(job)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async fetchAllJobs(): Promise<Job[]> {
    // For backward compatibility, fetch all jobs without pagination
    const result = await this.fetchJobs({ page: 1, limit: 1000 })
    return result.jobs
  }

  static async createJob(job: Omit<Job, "id" | "created_at" | "updated_at">): Promise<Job> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const jobData = this.toSnakeCase({ ...job, userId })

    const { data, error } = await supabase.from("jobs").insert([jobData]).select().single()

    if (error) {
      console.error("Error creating job in Supabase:", error)
      throw new Error("Failed to create job")
    }

    const createdJob = this.toCamelCase(data)

    // Automatically create an "applied" job event
    try {
      const appliedEvent = {
        jobId: createdJob.id,
        eventType: "applied" as const,
        eventDate: job.applicationDate,
        title: "Application Submitted",
        description: `Applied for ${job.position} at ${job.company}`,
      }

      await this.createJobEvent(appliedEvent)
    } catch (eventError) {
      console.error("Error creating applied event:", eventError)
      // Don't throw error here - job was created successfully, event creation is secondary
    }

    return createdJob
  }

  static async updateJob(id: number, job: Partial<Job>): Promise<Job> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const jobData = this.toSnakeCase(job)

    const { data, error } = await supabase
      .from("jobs")
      .update({ ...jobData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only update their own jobs
      .select()
      .single()

    if (error) {
      console.error("Error updating job in Supabase:", error)
      throw new Error("Failed to update job")
    }

    return this.toCamelCase(data)
  }

  static async deleteJob(id: number): Promise<void> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const { error } = await supabase.from("jobs").delete().eq("id", id).eq("user_id", userId) // Ensure user can only delete their own jobs

    if (error) {
      console.error("Error deleting job from Supabase:", error)
      throw new Error("Failed to delete job")
    }
  }

  static async toggleFavorite(id: number): Promise<Job> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()

    // First get the current favorite status
    const { data: currentJob, error: fetchError } = await supabase
      .from("jobs")
      .select("is_favorite")
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only access their own jobs
      .single()

    if (fetchError) {
      console.error("Error fetching job for favorite toggle:", fetchError)
      throw new Error("Failed to fetch job")
    }

    // Toggle the favorite status
    const { data, error } = await supabase
      .from("jobs")
      .update({
        is_favorite: !currentJob.is_favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only update their own jobs
      .select()
      .single()

    if (error) {
      console.error("Error toggling favorite in Supabase:", error)
      throw new Error("Failed to toggle favorite")
    }

    return this.toCamelCase(data)
  }

  // Job Events operations
  static async fetchJobEvents(jobId?: number): Promise<JobEvent[]> {
    // For backward compatibility, fetch all events without pagination
    const result = await this.fetchJobEventsPaginated(jobId, { page: 1, limit: 1000 })
    return result.events
  }

  static async fetchJobEventsPaginated(
    jobId?: number,
    params?: {
      page?: number
      limit?: number
    },
  ): Promise<{ events: JobEvent[]; pagination?: any }> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const page = params?.page || 1
    const limit = params?.limit || 50 // Higher default for events
    const offset = (page - 1) * limit

    let query = supabase
      .from("job_events")
      .select(
        `
        *,
        jobs (
          company,
          position,
          location
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", userId) // Filter by current user
      .order("event_date", { ascending: false })

    if (jobId) {
      query = query.eq("job_id", jobId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching job events from Supabase:", error)
      throw new Error("Failed to fetch job events")
    }

    // Transform the data to match our JobEvent interface
    const events = (data || []).map((event) => {
      const camelEvent = this.toCamelCase(event)
      return {
        ...camelEvent,
        company: event.jobs?.company || "",
        position: event.jobs?.position || "",
        location: event.jobs?.location || "",
      }
    })

    const total = count || 0

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async createJobEvent(event: Omit<JobEvent, "id" | "created_at" | "updated_at">): Promise<JobEvent> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()

    // Define allowed fields for job_events table to ensure we only send valid columns
    const allowedFields = [
      'jobId', 'eventType', 'eventDate', 'title', 'description',
      'interviewRound', 'interviewType', 'interviewLink', 'interviewResult',
      'notes', 'metadata'
    ]

    // Filter and clean the event data to only include allowed fields
    const cleanEvent: any = {}
    for (const field of allowedFields) {
      if (event.hasOwnProperty(field) && (event as any)[field] !== undefined) {
        cleanEvent[field] = (event as any)[field]
      }
    }

    const eventData = this.toSnakeCase({ ...cleanEvent, userId })

    const { data, error } = await supabase
      .from("job_events")
      .insert([eventData])
      .select("*")
      .single()

    if (error) {
      console.error("Error creating job event in Supabase:", error)
      throw new Error("Failed to create job event")
    }

    try {
      await this.updateJobStatusBasedOnEvent(event.jobId, event.eventType, event.interviewResult)
    } catch (statusError) {
      console.error("Error updating job status:", statusError)
      // Don't throw error here - event was created successfully, status update is secondary
    }

    const camelEvent = this.toCamelCase(data)
    return camelEvent
  }

  static async updateJobEvent(id: number, event: Partial<JobEvent>): Promise<JobEvent> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()

    // Define allowed fields for job_events table to ensure we only send valid columns
    // These must match the actual database schema exactly
    const allowedFields = [
      'jobId',           // converts to job_id
      'eventType',       // converts to event_type  
      'eventDate',       // converts to event_date
      'title', 
      'description',
      'interviewRound',  // converts to interview_round
      'interviewType',   // converts to interview_type
      'interviewLink',   // converts to interview_link
      'interviewResult', // converts to interview_result
      'notes', 
      'metadata'
    ]

    // Filter and clean the event data to only include allowed fields
    const cleanEvent: any = {}
    for (const field of allowedFields) {
      if (event.hasOwnProperty(field) && event[field as keyof JobEvent] !== undefined) {
        cleanEvent[field] = event[field as keyof JobEvent]
      }
    }

    // console.log("Clean event data being sent:", cleanEvent)
    
    const eventData = this.toSnakeCase(cleanEvent)
    // console.log("Snake case event data:", eventData)

    const { data: updatedEvent, error: updateError } = await supabase
      .from("job_events")
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating job event in Supabase:", updateError)
      throw new Error("Failed to update job event")
    }

    const camelEvent = this.toCamelCase(updatedEvent)
    return camelEvent
  }

  static async deleteJobEvent(id: number): Promise<void> {
    this.checkConfiguration()

    const userId = await this.getCurrentUserId()
    const { error } = await supabase.from("job_events").delete().eq("id", id).eq("user_id", userId) // Ensure user can only delete their own events

    if (error) {
      console.error("Error deleting job event from Supabase:", error)
      throw new Error("Failed to delete job event")
    }
  }

  // Helper function to update job status based on event type
  private static async updateJobStatusBasedOnEvent(
    jobId: number,
    eventType: string,
    interviewResult?: string,
  ): Promise<void> {
    let newStatus: string | null = null

    // Determine new job status based on event type
    switch (eventType) {
      case "interview_scheduled":
      case "interview":
        newStatus = "interview"
        break
      case "rejected":
        newStatus = "rejected"
        break
      case "offer_received":
        newStatus = "offer"
        break
      case "offer_accepted":
        newStatus = "accepted"
        break
      case "interview_result":
        // For interview results, check if it's failed
        if (interviewResult === "failed") {
          // Check if this is the latest interview result
          const isLatestFailed = await this.isLatestInterviewResultFailed(jobId)
          if (isLatestFailed) {
            newStatus = "rejected"
          }
        }
        break
    }

    // Update job status if needed
    if (newStatus) {
      const userId = await this.getCurrentUserId()
      const { error } = await supabase
        .from("jobs")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating job status:", error)
        throw new Error("Failed to update job status")
      }
    }
  }

  // Helper function to check if latest interview result is failed
  private static async isLatestInterviewResultFailed(jobId: number): Promise<boolean> {
    const userId = await this.getCurrentUserId()

    const { data, error } = await supabase
      .from("job_events")
      .select("interview_result")
      .eq("job_id", jobId)
      .eq("user_id", userId)
      .in("event_type", ["interview", "interview_result"])
      .not("interview_result", "is", null)
      .order("event_date", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching latest interview result:", error)
      return false
    }

    return data && data.length > 0 && data[0].interview_result === "failed"
  }
}

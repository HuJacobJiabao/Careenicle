import { supabase, isSupabaseConfigured } from "./supabase/client"
import type { Job, JobEvent } from "./types"

export class SupabaseService {
  // Check if Supabase is configured before any operation
  private static checkConfiguration(): void {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not properly configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables."
      )
    }
  }

  // Get current user ID from Supabase auth
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new Error("User not authenticated")
    }
    
    return user.id
  }

  // Helper function to convert camelCase to snake_case for database
  private static toSnakeCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      converted[snakeKey] = value
    }
    return converted
  }

  // Helper function to convert snake_case to camelCase from database
  private static toCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    
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

    let query = supabase
      .from("jobs")
      .select("*", { count: 'exact' })
      .eq("user_id", userId) // Filter by current user
    
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
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching jobs from Supabase:", error)
      throw new Error("Failed to fetch jobs")
    }

    const total = count || 0

    return {
      jobs: (data || []).map(job => this.toCamelCase(job)),
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
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only delete their own jobs

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
    }
  ): Promise<{ events: JobEvent[]; pagination?: any }> {
    this.checkConfiguration()
    
    const userId = await this.getCurrentUserId()
    const page = params?.page || 1
    const limit = params?.limit || 50 // Higher default for events
    const offset = (page - 1) * limit

    let query = supabase
      .from("job_events")
      .select(`
        *,
        jobs (
          company,
          position,
          location
        )
      `, { count: 'exact' })
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
    const eventData = this.toSnakeCase({ ...event, userId })
    
    const { data, error } = await supabase
      .from("job_events")
      .insert([eventData])
      .select(`
        *,
        jobs (
          company,
          position,
          location
        )
      `)
      .single()

    if (error) {
      console.error("Error creating job event in Supabase:", error)
      throw new Error("Failed to create job event")
    }

    const camelEvent = this.toCamelCase(data)
    return {
      ...camelEvent,
      company: data.jobs?.company || "",
      position: data.jobs?.position || "",
      location: data.jobs?.location || "",
    }
  }

  static async updateJobEvent(id: number, event: Partial<JobEvent>): Promise<JobEvent> {
    this.checkConfiguration()
    
    const userId = await this.getCurrentUserId()
    const eventData = this.toSnakeCase(event)
    
    const { data, error } = await supabase
      .from("job_events")
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only update their own events
      .select(`
        *,
        jobs (
          company,
          position,
          location
        )
      `)
      .single()

    if (error) {
      console.error("Error updating job event in Supabase:", error)
      throw new Error("Failed to update job event")
    }

    const camelEvent = this.toCamelCase(data)
    return {
      ...camelEvent,
      company: data.jobs?.company || "",
      position: data.jobs?.position || "",
      location: data.jobs?.location || "",
    }
  }

  static async deleteJobEvent(id: number): Promise<void> {
    this.checkConfiguration()
    
    const userId = await this.getCurrentUserId()
    const { error } = await supabase
      .from("job_events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only delete their own events

    if (error) {
      console.error("Error deleting job event from Supabase:", error)
      throw new Error("Failed to delete job event")
    }
  }
}

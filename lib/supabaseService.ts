import { supabase } from "./supabase/client"
import type { Job, JobEvent } from "./types"

export class SupabaseService {
  // Job operations
  static async fetchJobs(): Promise<Job[]> {
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching jobs from Supabase:", error)
      throw new Error("Failed to fetch jobs")
    }

    return data || []
  }

  static async createJob(job: Omit<Job, "id" | "created_at" | "updated_at">): Promise<Job> {
    const { data, error } = await supabase.from("jobs").insert([job]).select().single()

    if (error) {
      console.error("Error creating job in Supabase:", error)
      throw new Error("Failed to create job")
    }

    return data
  }

  static async updateJob(id: number, job: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from("jobs")
      .update({ ...job, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating job in Supabase:", error)
      throw new Error("Failed to update job")
    }

    return data
  }

  static async deleteJob(id: number): Promise<void> {
    const { error } = await supabase.from("jobs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting job from Supabase:", error)
      throw new Error("Failed to delete job")
    }
  }

  static async toggleFavorite(id: number): Promise<Job> {
    // First get the current favorite status
    const { data: currentJob, error: fetchError } = await supabase
      .from("jobs")
      .select("is_favorite")
      .eq("id", id)
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
      .select()
      .single()

    if (error) {
      console.error("Error toggling favorite in Supabase:", error)
      throw new Error("Failed to toggle favorite")
    }

    return data
  }

  // Job Events operations
  static async fetchJobEvents(jobId?: number): Promise<JobEvent[]> {
    let query = supabase
      .from("job_events")
      .select(`
        *,
        jobs (
          company,
          position,
          location
        )
      `)
      .order("event_date", { ascending: false })

    if (jobId) {
      query = query.eq("job_id", jobId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching job events from Supabase:", error)
      throw new Error("Failed to fetch job events")
    }

    // Transform the data to match our JobEvent interface
    return (data || []).map((event) => ({
      ...event,
      company: event.jobs?.company || "",
      position: event.jobs?.position || "",
      location: event.jobs?.location || "",
    }))
  }

  static async createJobEvent(event: Omit<JobEvent, "id" | "created_at" | "updated_at">): Promise<JobEvent> {
    const { data, error } = await supabase
      .from("job_events")
      .insert([event])
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

    return {
      ...data,
      company: data.jobs?.company || "",
      position: data.jobs?.position || "",
      location: data.jobs?.location || "",
    }
  }

  static async updateJobEvent(id: number, event: Partial<JobEvent>): Promise<JobEvent> {
    const { data, error } = await supabase
      .from("job_events")
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq("id", id)
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

    return {
      ...data,
      company: data.jobs?.company || "",
      position: data.jobs?.position || "",
      location: data.jobs?.location || "",
    }
  }

  static async deleteJobEvent(id: number): Promise<void> {
    const { error } = await supabase.from("job_events").delete().eq("id", id)

    if (error) {
      console.error("Error deleting job event from Supabase:", error)
      throw new Error("Failed to delete job event")
    }
  }
}

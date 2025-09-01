import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, eventTypes, provider } = body
    
    // Only handle PostgreSQL here
    if (provider !== "postgresql") {
      return NextResponse.json({ error: "Invalid provider for this API" }, { status: 400 })
    }

    if (!jobId || !eventTypes || !Array.isArray(eventTypes)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Delete job events by type
    const placeholders = eventTypes.map((_, index) => `$${index + 2}`).join(', ')
    const deleteQuery = `
      DELETE FROM job_events 
      WHERE job_id = $1 AND event_type IN (${placeholders})
    `
    
    const params = [jobId, ...eventTypes]
    await pool.query(deleteQuery, params)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete job events" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import type { JobEvent } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    let query = `
      SELECT 
        id,
        job_id as "jobId",
        event_type as "eventType",
        event_date as "eventDate",
        title,
        description,
        interview_round as "interviewRound",
        interview_type as "interviewType",
        interview_link as "interviewLink",
        interview_result as "interviewResult",
        notes,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM job_events
    `
    
    const params: any[] = []
    
    if (jobId) {
      query += " WHERE job_id = $1"
      params.push(parseInt(jobId))
    }
    
    query += " ORDER BY event_date DESC"

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch job events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jobId,
      eventType,
      eventDate,
      title,
      description,
      interviewRound,
      interviewType,
      interviewLink,
      interviewResult,
      notes,
      metadata
    }: JobEvent = body

    const result = await pool.query(
      `INSERT INTO job_events (
        job_id, event_type, event_date, title, description,
        interview_round, interview_type, interview_link, interview_result,
        notes, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        job_id as "jobId",
        event_type as "eventType",
        event_date as "eventDate",
        title,
        description,
        interview_round as "interviewRound",
        interview_type as "interviewType",
        interview_link as "interviewLink",
        interview_result as "interviewResult",
        notes,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        jobId,
        eventType,
        eventDate,
        title,
        description,
        interviewRound,
        interviewType,
        interviewLink,
        interviewResult,
        notes,
        metadata ? JSON.stringify(metadata) : null
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create job event" }, { status: 500 })
  }
}

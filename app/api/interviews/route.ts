import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    let query = `
      SELECT 
        id,
        job_id as "jobId",
        round,
        type,
        scheduled_date as "scheduledDate",
        actual_date as "actualDate",
        duration,
        interviewer,
        result,
        feedback,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM interviews
    `

    const params: any[] = []

    if (jobId) {
      query += " WHERE job_id = $1"
      params.push(Number.parseInt(jobId))
    }

    query += " ORDER BY scheduled_date ASC"

    const interviewsResult = await pool.query(query, params)
    return NextResponse.json(interviewsResult.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jobId,
      round,
      type,
      scheduledDate,
      actualDate,
      duration,
      interviewer,
      result = "pending",
      feedback,
      notes,
    } = body

    const insertResult = await pool.query(
      `
      INSERT INTO interviews (
        job_id, round, type, scheduled_date, actual_date, 
        duration, interviewer, result, feedback, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id,
        job_id as "jobId",
        round,
        type,
        scheduled_date as "scheduledDate",
        actual_date as "actualDate",
        duration,
        interviewer,
        result,
        feedback,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [jobId, round, type, scheduledDate, actualDate, duration, interviewer, result, feedback, notes],
    )

    return NextResponse.json(insertResult.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 })
  }
}

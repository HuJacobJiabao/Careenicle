import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        company,
        position,
        job_url as "jobUrl",
        application_date as "applicationDate",
        status,
        location,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM jobs 
      ORDER BY application_date DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, position, jobUrl, applicationDate, status = "applied", location, notes } = body

    const result = await pool.query(
      `
      INSERT INTO jobs (company, position, job_url, application_date, status, location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        company,
        position,
        job_url as "jobUrl",
        application_date as "applicationDate",
        status,
        location,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [company, position, jobUrl, applicationDate, status, location, notes],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

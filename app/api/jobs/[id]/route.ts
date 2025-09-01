import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider") || "postgresql"
    const { id } = await params
    const jobId = Number.parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Only handle PostgreSQL here
    if (provider !== "postgresql") {
      return NextResponse.json({ error: "Invalid provider for this API" }, { status: 400 })
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        company,
        position,
        job_url as "jobUrl",
        application_date as "applicationDate",
        status,
        location,
        CAST(latitude AS FLOAT) as latitude,
        CAST(longitude AS FLOAT) as longitude,
        formatted_address,
        place_id,
        notes,
        is_favorite as "isFavorite",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM jobs 
      WHERE id = $1
    `,
      [jobId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const job = result.rows[0]
    return NextResponse.json({
      ...job,
      latitude: job.latitude ? parseFloat(job.latitude) : null,
      longitude: job.longitude ? parseFloat(job.longitude) : null,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    const jobId = Number.parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    const { 
      company, 
      position, 
      jobUrl, 
      applicationDate, 
      status, 
      location, 
      latitude,
      longitude,
      formatted_address,
      place_id,
      notes, 
      isFavorite 
    } = body

    const result = await pool.query(
      `
      UPDATE jobs 
      SET 
        company = COALESCE($1, company),
        position = COALESCE($2, position),
        job_url = COALESCE($3, job_url),
        application_date = COALESCE($4, application_date),
        status = COALESCE($5, status),
        location = COALESCE($6, location),
        latitude = COALESCE($7, latitude),
        longitude = COALESCE($8, longitude),
        formatted_address = COALESCE($9, formatted_address),
        place_id = COALESCE($10, place_id),
        notes = COALESCE($11, notes),
        is_favorite = COALESCE($12, is_favorite)
      WHERE id = $13
      RETURNING id
    `,
      [company, position, jobUrl, applicationDate, status, location, latitude, longitude, formatted_address, place_id, notes, isFavorite, jobId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Job updated successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const jobId = Number.parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Delete related job events first (CASCADE should handle this, but let's be explicit)
    await pool.query("DELETE FROM job_events WHERE job_id = $1", [jobId])
    const result = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING id", [jobId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Job deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}

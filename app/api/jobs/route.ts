import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const favorites = searchParams.get("favorites") === "true"

    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (LOWER(company) LIKE LOWER($${paramIndex}) OR LOWER(position) LIKE LOWER($${paramIndex + 1}))`
      params.push(`%${search}%`, `%${search}%`)
      paramIndex += 2
    }

    if (status && status !== "all") {
      whereClause += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (favorites) {
      whereClause += ` AND is_favorite = true`
    }

    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) FROM jobs ${whereClause}`, params)
    const total = Number.parseInt(countResult.rows[0].count)

    // Get paginated results
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
      ${whereClause}
      ORDER BY application_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset],
    )

    return NextResponse.json({
      jobs: result.rows.map((job: any) => ({
        ...job,
        latitude: job.latitude ? parseFloat(job.latitude) : null,
        longitude: job.longitude ? parseFloat(job.longitude) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      company, 
      position, 
      jobUrl, 
      applicationDate, 
      status = "applied", 
      location, 
      latitude,
      longitude,
      formatted_address,
      place_id,
      notes, 
      isFavorite = false 
    } = body

    // Start a transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Insert the job
      const jobResult = await client.query(
        `
        INSERT INTO jobs (company, position, job_url, application_date, status, location, latitude, longitude, formatted_address, place_id, notes, is_favorite)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING 
          id,
          company,
          position,
          job_url as "jobUrl",
          application_date as "applicationDate",
          status,
          location,
          CAST(latitude AS FLOAT) as latitude,
          CAST(longitude AS FLOAT) as longitude,
          formatted_address as "formattedAddress",
          place_id as "placeId",
          notes,
          is_favorite as "isFavorite",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
        [company, position, jobUrl, applicationDate, status, location, latitude, longitude, formatted_address, place_id, notes, isFavorite],
      )

      const newJob = jobResult.rows[0]

      // Automatically create an "applied" event
      await client.query(
        `
        INSERT INTO job_events (
          job_id, event_type, event_date, title, description, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          newJob.id,
          'applied',
          applicationDate,
          `Applied to ${company} for ${position}`,
          `Applied for ${position} position at ${company}`,
          notes
        ]
      )

      await client.query('COMMIT')
      client.release()

      return NextResponse.json(newJob, { status: 201 })
    } catch (error) {
      await client.query('ROLLBACK')
      client.release()
      throw error
    }
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

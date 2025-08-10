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
      jobs: result.rows,
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
    const { company, position, jobUrl, applicationDate, status = "applied", location, notes, isFavorite = false } = body

    const result = await pool.query(
      `
      INSERT INTO jobs (company, position, job_url, application_date, status, location, notes, is_favorite)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id,
        company,
        position,
        job_url as "jobUrl",
        application_date as "applicationDate",
        status,
        location,
        notes,
        is_favorite as "isFavorite",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [company, position, jobUrl, applicationDate, status, location, notes, isFavorite],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

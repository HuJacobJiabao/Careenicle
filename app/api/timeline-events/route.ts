import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export interface TimelineEvent {
  id: number
  jobId: number
  company: string
  position: string
  location?: string
  eventType: string
  eventDate: string
  title?: string
  description?: string
  interviewRound?: number
  interviewType?: string
  interviewLink?: string
  interviewResult?: string
  notes?: string
  metadata?: any
}

export interface TimelineEventsResponse {
  events: TimelineEvent[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Allowed event types for timeline
    const allowedEventTypes = ["applied", "interview", "rejected", "offer_received", "offer_accepted"]

    // Build the query with JOIN
    let query = `
      SELECT
        je.id,
        je.job_id as "jobId",
        j.company,
        j.position,
        j.location,
        je.event_type as "eventType",
        je.event_date as "eventDate",
        je.title,
        je.description,
        je.interview_round as "interviewRound",
        je.interview_type as "interviewType",
        je.interview_link as "interviewLink",
        je.interview_result as "interviewResult",
        je.notes,
        je.metadata
      FROM job_events je
      INNER JOIN jobs j ON je.job_id = j.id
      WHERE je.event_type = ANY($1)
    `

    const params: any[] = [allowedEventTypes]
    let paramIndex = 2

    // Add date filters if provided
    if (dateFrom) {
      query += ` AND je.event_date >= $${paramIndex}`
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      query += ` AND je.event_date <= $${paramIndex}`
      params.push(dateTo)
      paramIndex++
    }

    // Add sorting and pagination
    query += ` ORDER BY je.event_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    // Execute the main query
    const result = await pool.query(query, params)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_events je
      INNER JOIN jobs j ON je.job_id = j.id
      WHERE je.event_type = ANY($1)
    `
    const countParams: any[] = [allowedEventTypes]
    let countParamIndex = 2

    if (dateFrom) {
      countQuery += ` AND je.event_date >= $${countParamIndex}`
      countParams.push(dateFrom)
      countParamIndex++
    }

    if (dateTo) {
      countQuery += ` AND je.event_date <= $${countParamIndex}`
      countParams.push(dateTo)
      countParamIndex++
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = Number.parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const response: TimelineEventsResponse = {
      events: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch timeline events" }, { status: 500 })
  }
}

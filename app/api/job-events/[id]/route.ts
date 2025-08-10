import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

// PUT /api/job-events/[id] - Update a job event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = Number.parseInt(id)
    const body = await request.json()

    const { eventType, eventDate, title, description, notes } = body

    const result = await pool.query(
      `UPDATE job_events 
       SET event_type = $1, event_date = $2, title = $3, description = $4, notes = $5, updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [eventType, eventDate, title, description, notes, eventId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating job event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

// DELETE /api/job-events/[id] - Delete a job event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = Number.parseInt(id)

    const result = await pool.query(
      "DELETE FROM job_events WHERE id = $1 RETURNING id",
      [eventId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting job event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}

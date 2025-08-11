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

    // Build dynamic update query based on provided fields
    const updateFields = []
    const values = []
    let paramCount = 1

    if (body.eventType !== undefined) {
      updateFields.push(`event_type = $${paramCount}`)
      values.push(body.eventType)
      paramCount++
    }
    if (body.eventDate !== undefined) {
      updateFields.push(`event_date = $${paramCount}`)
      values.push(body.eventDate)
      paramCount++
    }
    if (body.title !== undefined) {
      updateFields.push(`title = $${paramCount}`)
      values.push(body.title)
      paramCount++
    }
    if (body.description !== undefined) {
      updateFields.push(`description = $${paramCount}`)
      values.push(body.description)
      paramCount++
    }
    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`)
      values.push(body.notes)
      paramCount++
    }
    if (body.interviewRound !== undefined) {
      updateFields.push(`interview_round = $${paramCount}`)
      values.push(body.interviewRound)
      paramCount++
    }
    if (body.interviewType !== undefined) {
      updateFields.push(`interview_type = $${paramCount}`)
      values.push(body.interviewType)
      paramCount++
    }
    if (body.interviewer !== undefined) {
      updateFields.push(`interviewer = $${paramCount}`)
      values.push(body.interviewer)
      paramCount++
    }
    if (body.interviewResult !== undefined) {
      updateFields.push(`interview_result = $${paramCount}`)
      values.push(body.interviewResult)
      paramCount++
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`)
    
    if (updateFields.length === 1) { // Only updated_at
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(eventId) // Add eventId as the last parameter

    const result = await pool.query(
      `UPDATE job_events 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
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

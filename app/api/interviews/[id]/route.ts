import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const interviewId = Number.parseInt(params.id)

    if (isNaN(interviewId)) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 })
    }

    const { round, type, scheduledDate, actualDate, duration, interviewer, result, feedback, notes } = body

    const queryResult = await pool.query(
      `
      UPDATE interviews 
      SET 
        round = COALESCE($1, round),
        type = COALESCE($2, type),
        scheduled_date = COALESCE($3, scheduled_date),
        actual_date = COALESCE($4, actual_date),
        duration = COALESCE($5, duration),
        interviewer = COALESCE($6, interviewer),
        result = COALESCE($7, result),
        feedback = COALESCE($8, feedback),
        notes = COALESCE($9, notes)
      WHERE id = $10
      RETURNING id
    `,
      [round, type, scheduledDate, actualDate, duration, interviewer, result, feedback, notes, interviewId],
    )

    if (queryResult.rows.length === 0) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Interview updated successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const interviewId = Number.parseInt(params.id)

    if (isNaN(interviewId)) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 })
    }

    const result = await pool.query("DELETE FROM interviews WHERE id = $1 RETURNING id", [interviewId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Interview deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 })
  }
}

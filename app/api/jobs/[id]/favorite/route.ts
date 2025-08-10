import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = Number.parseInt(params.id)
    const { isFavorite } = await request.json()

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    const result = await pool.query("UPDATE jobs SET is_favorite = $1 WHERE id = $2 RETURNING id", [isFavorite, jobId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Favorite status updated successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 })
  }
}

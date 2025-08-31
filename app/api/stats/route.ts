import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider") || "postgresql"
    
    // Only handle PostgreSQL here - other providers are handled by DataService
    if (provider !== "postgresql") {
      return NextResponse.json({ error: "Invalid provider for this API" }, { status: 400 })
    }

    // Get overall statistics from the PostgreSQL database
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'interview' THEN 1 END) as active_interviews,
        COUNT(CASE WHEN status = 'offer' THEN 1 END) as offers_received,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorites,
        COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count
      FROM jobs
    `

    const result = await pool.query(statsQuery)
    const stats = result.rows[0]

    return NextResponse.json({
      totalApplications: parseInt(stats.total_applications),
      activeInterviews: parseInt(stats.active_interviews),
      offersReceived: parseInt(stats.offers_received),
      favorites: parseInt(stats.favorites),
      appliedCount: parseInt(stats.applied_count),
      rejectedCount: parseInt(stats.rejected_count),
      acceptedCount: parseInt(stats.accepted_count)
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
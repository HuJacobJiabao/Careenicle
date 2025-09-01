"use client"

import { useEffect } from "react"
import JobTable from "@/components/JobTable"

export default function HomePage() {
  useEffect(() => {
    // Initialize any mock data or startup logic here
    // console.log("Home page initialized")
  }, [])

  return (
    <div className="animate-fade-in">
      <JobTable />
    </div>
  )
}

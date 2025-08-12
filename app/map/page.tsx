"use client"

import { useState, useEffect } from 'react'
import { DataService } from '@/lib/dataService'
import GoogleJobMap from '@/components/GoogleJobMap'
import type { Job } from '@/lib/types'

export default function MapPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await DataService.fetchJobs({ limit: 1000 }) // Get all jobs for map
        setJobs(data.jobs)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Map</h1>
        <p className="text-gray-600">
          Geographic view of your job applications. Jobs are plotted based on company locations or city coordinates.
        </p>
      </div>
      
      <GoogleJobMap 
        jobs={jobs}
        selectedStatuses={selectedStatuses}
        onStatusFilterChange={setSelectedStatuses}
      />
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { DataService } from "@/lib/dataService"
import GoogleJobMap from "@/components/GoogleJobMap"
import { MapPin, Building2, Target, Globe, Lock } from "lucide-react"
import type { Job } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

interface LocationData {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  jobs: Job[]
}

export default function MapPage() {
  const { user, loading: authLoading, isInitialized } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.fetchJobs({ limit: 1000 }) // Get all jobs for map
      setJobs(data.jobs)
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Listen for data source changes from Header
  useEffect(() => {
    const handleStorageChange = () => {
      fetchJobs()
    }

    window.addEventListener("storage", handleStorageChange)
    // Also listen for custom events
    window.addEventListener("dataSourceChanged", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("dataSourceChanged", handleStorageChange)
    }
  }, [fetchJobs])

  // Process location data for statistics and city display
  const locationData = useMemo(() => {
    const locationMap = new Map<string, LocationData>()

    jobs.forEach((job) => {
      // Skip jobs without location data
      if (!job.latitude || !job.longitude) return

      let city = "Unknown"
      let state = "Unknown"

      // Try to extract city and state from formatted_address first
      if (job.formatted_address) {
        const addressParts = job.formatted_address.split(", ")
        if (addressParts.length >= 2) {
          city = addressParts[0] || "Unknown"
          // Handle state extraction - look for state abbreviation pattern
          const stateMatch = addressParts.find((part: string) => /^[A-Z]{2}(\s|$)/.test(part))
          if (stateMatch) {
            state = stateMatch.split(" ")[0]
          } else if (addressParts.length >= 2) {
            state = addressParts[1] || "Unknown"
          }
        }
      } else if (job.location) {
        // Fallback to location field
        const locationParts = job.location.split(", ")
        city = locationParts[0] || "Unknown"
        state = locationParts[1] || "Unknown"
      }

      const key = `${city}, ${state}`

      if (locationMap.has(key)) {
        const existing = locationMap.get(key)!
        existing.count += 1
        existing.jobs.push(job)
      } else {
        locationMap.set(key, {
          city,
          state,
          lat: job.latitude,
          lng: job.longitude,
          count: 1,
          jobs: [job],
        })
      }
    })

    return Array.from(locationMap.values())
  }, [jobs])

  // Statistics calculations
  const stats = useMemo(() => {
    const totalLocations = locationData.length
    const totalApplications = jobs.length
    const jobsWithLocation = jobs.filter((job) => job.latitude && job.longitude).length
    const topLocation =
      locationData.length > 0
        ? locationData.reduce((prev, current) => (prev.count > current.count ? prev : current))
        : null
    const statesCovered = new Set(locationData.map((loc) => loc.state).filter((state) => state !== "Unknown")).size

    return {
      totalLocations,
      totalApplications: jobsWithLocation, // Show jobs with location data
      topLocation: topLocation ? `${topLocation.city}, ${topLocation.state}` : "N/A",
      statesCovered,
    }
  }, [locationData, jobs])

  if (!isInitialized || authLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Job Applications Map</h1>
          <p className="text-base sm:text-lg text-gray-600 px-2 sm:px-0">
            Visualize your job applications across different locations with real geographic data.
          </p>
        </div>

        {/* Login Required Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Login Required for Google Map Access</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Please log in to your account to view the geographic distribution of your job applications and detailed map
            visualization features.
          </p>
          <div className="flex justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Login Now
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading job map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Job Applications Map</h1>
        <p className="text-base sm:text-lg text-gray-600 px-2 sm:px-0">
          Visualize your job applications across different locations with real geographic data.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10 animate-scale-in">
        {[
          {
            label: "Total Locations",
            value: stats.totalLocations,
            color: "from-blue-500 to-blue-600",
            icon: <MapPin className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
          },
          {
            label: "Applications w/ Location",
            value: stats.totalApplications,
            color: "from-green-500 to-emerald-500",
            icon: <Building2 className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-green-50",
            textColor: "text-green-700",
          },
          {
            label: "Top Location",
            value: stats.topLocation,
            color: "from-orange-500 to-amber-500",
            icon: <Target className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-orange-50",
            textColor: "text-orange-700",
            isTopLocation: true,
          },
          {
            label: "States Covered",
            value: stats.statesCovered,
            color: "from-purple-500 to-violet-500",
            icon: <Globe className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-purple-50",
            textColor: "text-purple-700",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-1 
                         p-3 md:p-6 
                         h-20 md:h-auto 
                         border border-gray-100"
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-600 uppercase tracking-wide mb-0.5 md:mb-2 text-[10px] md:text-sm leading-tight">
                  {stat.label}
                </p>
                <p
                  className={`font-bold text-gray-900 ${
                    stat.isTopLocation ? "text-xs md:text-xl leading-tight" : "text-sm md:text-3xl"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-1.5 md:p-4 rounded-md md:rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-sm md:shadow-lg group-hover:shadow-xl transition-all duration-200 flex-shrink-0 ml-2`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Map Container - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <GoogleJobMap jobs={jobs} selectedStatuses={selectedStatuses} onStatusFilterChange={setSelectedStatuses} />
        </div>

        {/* Location Details - Horizontal Layout */}
        <div className="space-y-4 sm:space-y-6">
          {/* Location List - Horizontal Scrolling */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">Locations</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              {locationData
                .sort((a, b) => b.count - a.count)
                .map((location, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-44 sm:w-48 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLocation === location
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            location.count === 1
                              ? "bg-blue-500"
                              : location.count <= 3
                                ? "bg-green-500"
                                : location.count <= 5
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                          }`}
                        >
                          {location.count}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{location.city}</div>
                        <div className="text-xs text-gray-600">{location.state}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {location.count} app{location.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Location Details */}
          {selectedLocation && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">
                {selectedLocation.city}, {selectedLocation.state}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {selectedLocation.jobs.map((job, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <img
                          src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                          alt={`${job.company} logo`}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg mr-2 sm:mr-3 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=32&width=32&text=" + job.company.charAt(0)
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate">{job.position}</div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">{job.company}</div>
                          <div className="text-xs text-gray-500">
                            Applied: {new Date(job.applicationDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
                          job.status === "applied"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "interview"
                              ? "bg-amber-100 text-amber-800"
                              : job.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : job.status === "offer"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

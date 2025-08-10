"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, LocationData } from "@/lib/types"
import { MapPin } from "lucide-react"

const JobMap: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)

  // US state coordinates (approximate centers)
  const stateCoordinates: Record<string, { lat: number; lng: number }> = {
    CA: { lat: 36.7783, lng: -119.4179 },
    NY: { lat: 43.2994, lng: -74.2179 },
    TX: { lat: 31.9686, lng: -99.9018 },
    FL: { lat: 27.7663, lng: -81.6868 },
    WA: { lat: 47.7511, lng: -120.7401 },
    OR: { lat: 43.8041, lng: -120.5542 },
    NV: { lat: 38.3135, lng: -117.0554 },
    AZ: { lat: 34.0489, lng: -111.0937 },
    CO: { lat: 39.0598, lng: -105.3111 },
    IL: { lat: 40.3363, lng: -89.0022 },
    MA: { lat: 42.2352, lng: -71.0275 },
    VA: { lat: 37.7693, lng: -78.17 },
    NC: { lat: 35.6301, lng: -79.8064 },
    GA: { lat: 33.0406, lng: -83.6431 },
    OH: { lat: 40.3888, lng: -82.7649 },
    PA: { lat: 40.5908, lng: -77.2098 },
    MI: { lat: 43.3266, lng: -84.5361 },
    MN: { lat: 45.7326, lng: -93.9196 },
    WI: { lat: 44.2619, lng: -89.6165 },
    IA: { lat: 42.0115, lng: -93.2105 },
    MO: { lat: 38.4561, lng: -92.2884 },
    AR: { lat: 34.9513, lng: -92.3809 },
    LA: { lat: 31.1801, lng: -91.8749 },
    MS: { lat: 32.7673, lng: -89.6812 },
    AL: { lat: 32.3617, lng: -86.7916 },
    TN: { lat: 35.7449, lng: -86.7489 },
    KY: { lat: 37.6681, lng: -84.6701 },
    IN: { lat: 39.8647, lng: -86.2604 },
    SC: { lat: 33.8191, lng: -80.9066 },
    WV: { lat: 38.468, lng: -80.9696 },
    MD: { lat: 39.0639, lng: -76.8021 },
    DE: { lat: 39.3185, lng: -75.5071 },
    NJ: { lat: 40.314, lng: -74.5089 },
    CT: { lat: 41.5978, lng: -72.7554 },
    RI: { lat: 41.6809, lng: -71.5118 },
    VT: { lat: 44.0407, lng: -72.7093 },
    NH: { lat: 43.4525, lng: -71.5639 },
    ME: { lat: 44.6939, lng: -69.3819 },
    UT: { lat: 40.1135, lng: -111.8535 },
    ID: { lat: 44.2394, lng: -114.5103 },
    MT: { lat: 47.0527, lng: -110.2148 },
    WY: { lat: 42.7475, lng: -107.2085 },
    ND: { lat: 47.5362, lng: -99.793 },
    SD: { lat: 44.2853, lng: -99.4632 },
    NE: { lat: 41.1289, lng: -98.2883 },
    KS: { lat: 38.5111, lng: -96.8005 },
    OK: { lat: 35.5376, lng: -96.9247 },
    NM: { lat: 34.8375, lng: -106.2371 },
    AK: { lat: 61.3025, lng: -152.2782 },
    HI: { lat: 21.1098, lng: -157.5311 },
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      // Fetch all jobs without pagination for map view
      const response = await fetch("/api/jobs?limit=1000")
      const data = await response.json()
      setJobs(data.jobs)
      processLocationData(data.jobs)
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const processLocationData = (jobs: Job[]) => {
    const locationMap = new Map<string, LocationData>()

    jobs.forEach((job) => {
      if (!job.location) return

      const [city, state] = job.location.split(", ")
      if (!state || !stateCoordinates[state]) return

      const key = `${city}, ${state}`
      if (locationMap.has(key)) {
        const existing = locationMap.get(key)!
        existing.count += 1
        existing.jobs.push(job)
      } else {
        locationMap.set(key, {
          city,
          state,
          lat: stateCoordinates[state].lat + (Math.random() - 0.5) * 2, // Add some randomness for city positioning
          lng: stateCoordinates[state].lng + (Math.random() - 0.5) * 2,
          count: 1,
          jobs: [job],
        })
      }
    })

    setLocationData(Array.from(locationMap.values()))
  }

  const getMarkerSize = (count: number) => {
    if (count === 1) return "w-8 h-8"
    if (count <= 3) return "w-10 h-10"
    if (count <= 5) return "w-12 h-12"
    return "w-14 h-14"
  }

  const getMarkerColor = (count: number) => {
    if (count === 1) return "bg-blue-500"
    if (count <= 3) return "bg-green-500"
    if (count <= 5) return "bg-orange-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Applications Map</h1>
        <p className="text-gray-600">Visualize your job applications across the United States</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-xl">🗺️</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{locationData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 text-white text-xl">🏢</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3 text-white text-xl">📍</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Location</p>
              <p className="text-2xl font-bold text-gray-900">
                {locationData.length > 0
                  ? locationData.reduce((prev, current) => (prev.count > current.count ? prev : current)).city
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 text-white text-xl">🎯</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">States Covered</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(locationData.map((loc) => loc.state)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">United States Job Map</h2>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "600px" }}>
              {/* Simple US Map SVG */}
              <svg
                viewBox="0 0 1000 600"
                className="w-full h-full"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              >
                {/* US Map Outline (simplified) */}
                <path
                  d="M 100 150 L 900 150 L 900 450 L 100 450 Z"
                  fill="rgba(255,255,255,0.1)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />

                {/* Location Markers */}
                {locationData.map((location, index) => {
                  const x = ((location.lng + 125) / 60) * 800 + 100 // Convert lng to x coordinate
                  const y = ((50 - location.lat) / 25) * 300 + 150 // Convert lat to y coordinate

                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r={Math.max(8, Math.min(30, location.count * 4))}
                        fill={
                          location.count === 1
                            ? "#3b82f6"
                            : location.count <= 3
                              ? "#10b981"
                              : location.count <= 5
                                ? "#f59e0b"
                                : "#ef4444"
                        }
                        fillOpacity="0.8"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedLocation(location)}
                      />
                      <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        className="text-white text-sm font-bold pointer-events-none"
                        style={{ fontSize: "12px" }}
                      >
                        {location.count}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Applications per Location</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">1 application</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">2-3 applications</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">4-5 applications</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">6+ applications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="space-y-6">
          {/* Location List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Locations</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {locationData
                .sort((a, b) => b.count - a.count)
                .map((location, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLocation === location
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {location.city}, {location.state}
                          </div>
                          <div className="text-sm text-gray-500">
                            {location.count} application{location.count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getMarkerColor(location.count)}`}
                      >
                        {location.count}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Location Details */}
          {selectedLocation && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedLocation.city}, {selectedLocation.state}
              </h2>
              <div className="space-y-4">
                {selectedLocation.jobs.map((job, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <img
                          src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                          alt={`${job.company} logo`}
                          className="w-8 h-8 rounded-lg mr-3"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=32&width=32&text=" + job.company.charAt(0)
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{job.position}</div>
                          <div className="text-sm text-gray-600">{job.company}</div>
                          <div className="text-xs text-gray-500">
                            Applied: {new Date(job.applicationDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
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

export default JobMap

"use client"

import { useState } from "react"
import { useMapData } from "@/lib/hooks/useMapData"
import GoogleJobMap from "@/components/GoogleJobMap"
import { MapPin, Building2, Target, Globe } from "lucide-react"

interface LocationData {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  jobs: any[]
}

export default function MapPage() {
  const { data, isLoading: loading, error } = useMapData()
  const jobs = data?.jobs || []
  const locationData = data?.locationData || []
  const stats = data?.stats || {
    totalLocations: 0,
    totalApplications: 0,
    topLocation: "N/A",
    statesCovered: 0,
  }

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)

  if (error) {
    console.error("Failed to fetch map data:", error)
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

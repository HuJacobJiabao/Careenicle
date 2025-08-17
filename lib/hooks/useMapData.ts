import { useQuery } from "@tanstack/react-query"
import { DataService } from "@/lib/dataService"
import type { Job } from "@/lib/types"

interface LocationData {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  jobs: Job[]
}

interface MapStats {
  totalLocations: number
  totalApplications: number
  topLocation: string
  statesCovered: number
}

interface MapData {
  jobs: Job[]
  locationData: LocationData[]
  stats: MapStats
}

export function useMapData() {
  return useQuery({
    queryKey: ["map-data"],
    queryFn: async (): Promise<MapData> => {
      // Fetch all jobs for map visualization
      const data = await DataService.fetchJobs({ limit: 1000 })
      const jobs = data.jobs

      // Process location data
      const locationMap = new Map<string, LocationData>()

      jobs.forEach((job) => {
        // Skip jobs without location data
        if (!job.latitude || !job.longitude) return

        let city = "Unknown"
        let state = "Unknown"

        // Extract city and state from formatted_address
        if (job.formatted_address) {
          const addressParts = job.formatted_address.split(", ")
          if (addressParts.length >= 2) {
            city = addressParts[0] || "Unknown"
            const stateMatch = addressParts.find((part: string) => /^[A-Z]{2}(\s|$)/.test(part))
            if (stateMatch) {
              state = stateMatch.split(" ")[0]
            } else if (addressParts.length >= 2) {
              state = addressParts[1] || "Unknown"
            }
          }
        } else if (job.location) {
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

      const locationData = Array.from(locationMap.values())

      // Calculate statistics
      const totalLocations = locationData.length
      const jobsWithLocation = jobs.filter((job) => job.latitude && job.longitude).length
      const topLocation =
        locationData.length > 0
          ? locationData.reduce((prev, current) => (prev.count > current.count ? prev : current))
          : null
      const statesCovered = new Set(locationData.map((loc) => loc.state).filter((state) => state !== "Unknown")).size

      const stats: MapStats = {
        totalLocations,
        totalApplications: jobsWithLocation,
        topLocation: topLocation ? `${topLocation.city}, ${topLocation.state}` : "N/A",
        statesCovered,
      }

      return { jobs, locationData, stats }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

"use client"

import React, { useEffect, useRef, useState } from 'react'
import type { Job } from '@/lib/types'

interface GoogleJobMapProps {
  jobs: Job[]
  selectedStatuses: string[]
  onStatusFilterChange: (statuses: string[]) => void
}

interface MarkerWithJob extends google.maps.Marker {
  jobData?: Job
}

const GoogleJobMap: React.FC<GoogleJobMapProps> = ({ 
  jobs, 
  selectedStatuses, 
  onStatusFilterChange 
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<MarkerWithJob[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const statusColors = {
    applied: '#3B82F6',
    interview: '#F59E0B',
    offer: '#10B981',
    rejected: '#EF4444',
    accepted: '#8B5CF6',
  }

  const statusLabels = {
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    accepted: 'Accepted',
  }

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true)
      return
    }

    // Only add script if it doesn't exist
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=en&region=US`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => console.error('Failed to load Google Maps script')
      document.head.appendChild(script)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 4,
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }, { lightness: 17 }],
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 20 }],
        },
      ],
    })

    infoWindowRef.current = new google.maps.InfoWindow({
      disableAutoPan: false,
      maxWidth: 280,
    })

    // Hide the close button and fix InfoWindow styling
    const style = document.createElement('style')
    style.textContent = `
      .gm-ui-hover-effect {
        display: none !important;
      }
      .gm-style-iw button {
        display: none !important;
      }
      .gm-style-iw-d {
        overflow: visible !important;
        padding: 12px !important;
        max-width: 280px !important;
      }
      .gm-style-iw {
        max-width: 280px !important;
        border-radius: 8px !important;
      }
      .gm-style-iw-c {
        padding: 0 !important;
        border-radius: 8px !important;
      }
    `
    document.head.appendChild(style)
  }, [isLoaded])

  // Get company logo URL
  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  // Create marker content
  const createMarkerContent = (job: Job) => {
    const logoUrl = getCompanyLogo(job.company)
    return `
      <div style="width: 256px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <img
            src="${logoUrl}"
            alt="${job.company} logo"
            style="height: 40px; width: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb;"
            onerror="this.src='/placeholder.svg?height=40&width=40&text=${job.company?.charAt(0) ?? '·'}'"
          />
          <div style="min-width: 0; flex: 1;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827; line-height: 1.2; word-wrap: break-word;">
              ${job.company}
            </h3>
            <p style="margin: 2px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.2; word-wrap: break-word;">
              ${job.position}
            </p>
          </div>
        </div>

        <!-- Meta -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <!-- Status Badge -->
          <span
            style="
              display: inline-flex;
              align-items: center;
              border-radius: 9999px;
              padding: 4px 10px;
              font-size: 13px;
              font-weight: 500;
              color: ${statusColors[job.status]};
              background-color: ${statusColors[job.status]}20;
              border: 1px solid ${statusColors[job.status]}33;
            "
          >
            ${statusLabels[job.status]}
          </span>

          ${job.location ? `
            <span style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #6b7280; flex-shrink: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" style="height: 12px; width: 12px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
              </svg>
              <span style="word-wrap: break-word; max-width: 120px;" title="${job.location}">${job.location}</span>
            </span>
          ` : ``}
        </div>

        <!-- Notes -->
        ${job.notes ? `
          <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.4; color: #374151; word-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${job.notes}
          </p>
        ` : ``}
      </div>
    `
  }

  // Create custom marker icon
  const createMarkerIcon = (status: string) => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: statusColors[status as keyof typeof statusColors] || '#6B7280',
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8,
    }
  }

  // Update markers based on jobs and filter
  useEffect(() => {
    if (!mapInstanceRef.current || !infoWindowRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Filter jobs by selected statuses and location data
    const filteredJobs = jobs.filter(job => {
      const hasCoords = job.latitude != null && job.longitude != null
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(job.status)
      return hasCoords && statusMatch
    })

    // Create new markers
    filteredJobs.forEach(job => {
      // Convert and validate coordinates
      const lat = Number(job.latitude)
      const lng = Number(job.longitude)
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for job ${job.id}: lat=${job.latitude}, lng=${job.longitude}`)
        return
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: createMarkerIcon(job.status),
        title: `${job.company} - ${job.position}`,
      }) as MarkerWithJob

      marker.jobData = job

      // Add hover listeners for info window
      marker.addListener('mouseover', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(createMarkerContent(job))
          infoWindowRef.current.open(mapInstanceRef.current, marker)
        }
      })

      marker.addListener('mouseout', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
      })

      markersRef.current.push(marker)
    })

    // Adjust map bounds to show all markers
    if (filteredJobs.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      filteredJobs.forEach(job => {
        const lat = Number(job.latitude)
        const lng = Number(job.longitude)
        
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng })
        }
      })
      
      mapInstanceRef.current!.fitBounds(bounds)
      
      // Prevent over-zooming for single markers
      google.maps.event.addListenerOnce(mapInstanceRef.current!, 'bounds_changed', () => {
        if (mapInstanceRef.current && mapInstanceRef.current.getZoom()! > 15) {
          mapInstanceRef.current.setZoom(15)
        }
      })
    }
  }, [jobs, selectedStatuses, isLoaded])

  // Handle status filter changes
  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    onStatusFilterChange(newStatuses)
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-4">Google Maps API key is required to display the map.</p>
        <p className="text-sm text-gray-400">
          Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Status Filter */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Status Filter</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedStatuses.length === 0 || selectedStatuses.includes(status)
                  ? 'text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedStatuses.length === 0 || selectedStatuses.includes(status) 
                  ? statusColors[status as keyof typeof statusColors] 
                  : undefined
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: selectedStatuses.length === 0 || selectedStatuses.includes(status) ? 'white' : statusColors[status as keyof typeof statusColors] }}
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-96" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {markersRef.current.length} of {jobs.filter(j => j.latitude && j.longitude).length} jobs with location data
          </span>
          <span>
            {jobs.filter(j => !j.latitude || !j.longitude).length} jobs without coordinates
          </span>
        </div>
      </div>
    </div>
  )
}

export default GoogleJobMap

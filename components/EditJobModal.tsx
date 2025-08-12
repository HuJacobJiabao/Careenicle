"use client"

import type React from "react"
import { useState } from "react"
import { googlePlacesService } from "@/lib/googlePlacesService"
import LocationAutocomplete from "./LocationAutocomplete"
import type { Job } from "@/lib/types"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Star } from "lucide-react"

interface EditJobModalProps {
  job: Job
  onClose: () => void
  onUpdate: () => void
}

const EditJobModal: React.FC<EditJobModalProps> = ({ job, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    company: job.company,
    position: job.position,
    jobUrl: job.jobUrl || "",
    applicationDate: new Date(job.applicationDate).toISOString().split("T")[0],
    status: job.status,
    location: job.location || "",
    notes: job.notes || "",
    isFavorite: job.isFavorite || false,
  })
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(job.place_id || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Get geographic coordinates if location changed
      let locationData = null
      if (formData.location && formData.location !== job.location) {
        if (formData.company && formData.location) {
          // Try to find company-specific location first
          locationData = await googlePlacesService.geocodeCompanyLocation(
            formData.company, 
            formData.location
          )
        }
        
        // If no company-specific location found, use city coordinates
        if (!locationData) {
          locationData = await googlePlacesService.geocodeLocation(formData.location)
        }
      }

      const updateData = {
        ...formData,
        applicationDate: new Date(formData.applicationDate),
        jobUrl: formData.jobUrl || undefined, // Convert empty string to undefined
        latitude: locationData?.lat || job.latitude,
        longitude: locationData?.lng || job.longitude,
        formatted_address: locationData?.formattedAddress || job.formatted_address,
        place_id: locationData?.placeId || job.place_id,
      }

      await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to update job:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Job Application</h2>
              <p className="text-gray-600 mt-1">Update job details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 mr-2" />
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Google, Microsoft, Apple"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 mr-2" />
                Position Title *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value, placeId) => {
                  setFormData({ ...formData, location: value })
                  setSelectedPlaceId(placeId || "")
                }}
                placeholder="e.g., San Francisco, CA or New York, NY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Link className="w-4 h-4 mr-2" />
                Job Posting URL
              </label>
              <input
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://... (optional)"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Application Date
              </label>
              <input
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Job["status"] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="offer">Offer</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Job requirements, company culture, salary range, etc..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFavorite"
                checked={formData.isFavorite}
                onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
              />
              <label htmlFor="isFavorite" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                <Star className="w-4 h-4 mr-1 fill-current text-yellow-500" />
                Mark as favorite
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
              >
                Update Job Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditJobModal

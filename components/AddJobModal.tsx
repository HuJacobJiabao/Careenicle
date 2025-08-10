"use client"

import type React from "react"
import { useState } from "react"
import { DataService } from "@/lib/dataService"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Heart } from "lucide-react"

interface AddJobModalProps {
  onClose: () => void
  onAdd: () => void
}

const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    jobUrl: "",
    applicationDate: new Date().toISOString().split("T")[0],
    status: "applied" as const,
    location: "",
    notes: "",
    isFavorite: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await DataService.createJob(formData)
      onAdd()
    } catch (error) {
      console.error("Failed to add job:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl animate-scale-in">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Job Application</h2>
              <p className="text-gray-600 font-medium">Track a new job opportunity in your pipeline</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors duration-200 focus-ring"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Google, Microsoft, Apple"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="form-input"
                placeholder="e.g., San Francisco, CA or New York, NY"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <Link className="w-5 h-5 mr-2 text-indigo-600" />
                Job Posting URL *
              </label>
              <input
                type="url"
                required
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                className="form-input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <Calendar className="w-5 h-5 mr-2 text-amber-600" />
                Application Date
              </label>
              <input
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input resize-none"
                rows={4}
                placeholder="Job requirements, company culture, salary range, etc..."
              />
            </div>

            <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-200">
              <input
                type="checkbox"
                id="isFavorite"
                checked={formData.isFavorite}
                onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="isFavorite" className="ml-3 text-sm font-bold text-red-700 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Mark as favorite position
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add Job Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddJobModal

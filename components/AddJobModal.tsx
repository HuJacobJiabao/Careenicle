"use client"

import type React from "react"
import { useState } from "react"
import { DataService } from "@/lib/dataService"
import { googlePlacesService } from "@/lib/googlePlacesService"
import LocationAutocomplete from "./LocationAutocomplete"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Get geographic coordinates for the job location
      let locationData = null
      if (formData.location) {
        if (formData.company && formData.location) {
          // Try to find company-specific location first
          locationData = await googlePlacesService.geocodeCompanyLocation(formData.company, formData.location)
        }

        // If no company-specific location found, use city coordinates
        if (!locationData) {
          locationData = await googlePlacesService.geocodeLocation(formData.location)
        }
      }

      const jobData = {
        ...formData,
        applicationDate: new Date(formData.applicationDate),
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        formatted_address: locationData?.formattedAddress,
        place_id: locationData?.placeId,
      }

      await DataService.createJob(jobData)
      onAdd()
    } catch (error) {
      console.error("Failed to add job:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="max-w-2xl w-full shadow-2xl animate-scale-in border-0">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-slate-800">Add New Job Application</CardTitle>
              <p className="text-slate-600 font-medium">Track a new job opportunity in your pipeline</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-slate-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                  Company Name *
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                  Position Title *
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="h-11 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                Location
              </Label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value, placeId) => {
                  setFormData({ ...formData, location: value })
                  setSelectedPlaceId(placeId || "")
                }}
                placeholder="e.g., San Francisco, CA or New York, NY"
                className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <Link className="w-4 h-4 mr-2 text-indigo-600" />
                Job Posting URL
              </Label>
              <Input
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                placeholder="https://... (optional)"
                className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <Calendar className="w-4 h-4 mr-2 text-amber-600" />
                Application Date
              </Label>
              <Input
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 mr-2 text-slate-600" />
                Notes
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Job requirements, company culture, salary range, etc..."
                rows={4}
                className="resize-none border-slate-200 focus:border-slate-500 focus:ring-slate-500/20"
              />
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isFavorite"
                    checked={formData.isFavorite}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFavorite: !!checked })}
                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <Label
                    htmlFor="isFavorite"
                    className="text-sm font-semibold text-yellow-700 flex items-center cursor-pointer"
                  >
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Mark as favorite position
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Job Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddJobModal

"use client"

import type React from "react"
import { useState } from "react"
import { googlePlacesService } from "@/lib/googlePlacesService"
import { DataService } from "@/lib/dataService"
import LocationAutocomplete from "./LocationAutocomplete"
import type { Job } from "@/lib/types"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Star, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
    applicationDate: new Date(job.applicationDate),
    status: job.status,
    location: job.location || "",
    notes: job.notes || "",
    isFavorite: job.isFavorite || false,
  })
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(job.place_id || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let locationData = null
      const companyChanged = formData.company !== job.company
      const locationChanged = formData.location !== job.location

      if (formData.location && (companyChanged || locationChanged)) {
        if (formData.company && formData.location) {
          // Try to find company-specific location first
          locationData = await googlePlacesService.geocodeCompanyLocation(formData.company, formData.location)
        }

        // If no company-specific location found, use city coordinates
        if (!locationData) {
          locationData = await googlePlacesService.geocodeLocation(formData.location)
        }
      }

      const updateData = {
        ...formData,
        applicationDate: formData.applicationDate,
        jobUrl: formData.jobUrl || undefined, // Convert empty string to undefined
        latitude: locationData?.lat || job.latitude,
        longitude: locationData?.lng || job.longitude,
        formatted_address: locationData?.formattedAddress || job.formatted_address,
        place_id: locationData?.placeId || job.place_id,
      }

      await DataService.updateJob(job.id!, updateData)

      await new Promise((resolve) => setTimeout(resolve, 500))

      onUpdate()

      onClose()
    } catch (error) {
      console.error("Failed to update job:", error)
      setError("Failed to update job. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "interview":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "offer":
        return "bg-green-100 text-green-800 border-green-200"
      case "accepted":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                Edit Job Application
              </CardTitle>
              <p className="text-slate-600">Update your job application details</p>
              <Badge className={`w-fit ${getStatusColor(formData.status)}`}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  Company Name *
                </Label>
                <Input
                  id="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="h-11"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                  Position Title *
                </Label>
                <Input
                  id="position"
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="h-11"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-slate-600" />
                Location
              </Label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value, placeId) => {
                  setFormData({ ...formData, location: value })
                  setSelectedPlaceId(placeId || "")
                }}
                placeholder="e.g., San Francisco, CA or New York, NY"
                className="h-11 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobUrl" className="flex items-center gap-2 text-sm font-medium">
                  <Link className="w-4 h-4 text-slate-600" />
                  Job Posting URL
                </Label>
                <Input
                  id="jobUrl"
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  placeholder="https://... (optional)"
                  className="h-11"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDate" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  Application Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start text-left font-normal",
                        !formData.applicationDate && "text-muted-foreground",
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.applicationDate ? format(formData.applicationDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.applicationDate}
                      onSelect={(date) => date && setFormData({ ...formData, applicationDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Job["status"] })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-slate-600" />
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Job requirements, company culture, salary range, etc..."
                rows={4}
                className="resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Checkbox
                id="isFavorite"
                checked={formData.isFavorite}
                onCheckedChange={(checked) => setFormData({ ...formData, isFavorite: checked as boolean })}
                className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                disabled={isSubmitting}
              />
              <Label htmlFor="isFavorite" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                Mark as favorite
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="px-6 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Job Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditJobModal

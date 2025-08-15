"use client"

import type React from "react"
import { useState } from "react"
import { DataService } from "@/lib/dataService"
import { googlePlacesService } from "@/lib/googlePlacesService"
import LocationAutocomplete from "./LocationAutocomplete"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Star, CalendarIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AddJobModalProps {
  onClose: () => void
  onAdd: () => void
}

const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    jobUrl: "",
    applicationDate: new Date(),
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
        applicationDate: formData.applicationDate,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border-0">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1 sm:space-y-2">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">Add New Job Application</CardTitle>
              <p className="text-sm sm:text-base text-slate-600 font-medium">Track a new job opportunity in your pipeline</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-slate-100 transition-colors duration-200 h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-600" />
                  Company Name *
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-600" />
                  Position Title *
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-600" />
                Location
              </Label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value, placeId) => {
                  setFormData({ ...formData, location: value })
                  setSelectedPlaceId(placeId || "")
                }}
                placeholder="e.g., San Francisco, CA or New York, NY"
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-indigo-600" />
                Job Posting URL
              </Label>
              <Input
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                placeholder="https://... (optional)"
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-amber-600" />
                Application Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 sm:h-11 w-full justify-start text-left font-normal text-sm sm:text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500/20",
                      !formData.applicationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
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

            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-600" />
                Notes
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Job requirements, company culture, salary range, etc..."
                rows={3}
                className="resize-none text-sm sm:text-base border-slate-200 focus:border-slate-500 focus:ring-slate-500/20"
              />
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Checkbox
                    id="isFavorite"
                    checked={formData.isFavorite}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFavorite: !!checked })}
                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <Label
                    htmlFor="isFavorite"
                    className="text-xs sm:text-sm font-semibold text-yellow-700 flex items-center cursor-pointer"
                  >
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 fill-current" />
                    Mark as favorite position
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-row justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-6 py-2.5 text-sm sm:text-base border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-6 py-2.5 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddJobModal

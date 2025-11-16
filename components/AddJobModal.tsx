"use client"

import type React from "react"
import { useState } from "react"
import { DataService } from "@/lib/dataService"
import { googlePlacesService } from "@/lib/googlePlacesService"
import LocationAutocomplete from "./LocationAutocomplete"
import { X, Building2, Briefcase, Link, Calendar, FileText, MapPin, Star, CalendarIcon, Sparkles } from "lucide-react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [smartPasteText, setSmartPasteText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [showSmartPaste, setShowSmartPaste] = useState(true)

  const handleSmartParse = async () => {
    if (!smartPasteText.trim()) {
      return
    }

    setIsParsing(true)
    try {
      const response = await fetch("/api/parse-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: smartPasteText }),
      })

      if (!response.ok) {
        throw new Error("Failed to parse job text")
      }

      const result = await response.json()
      const parsedData = result.data

      // Update form with parsed data
      setFormData({
        ...formData,
        company: parsedData.company || formData.company,
        position: parsedData.position || formData.position,
        location: parsedData.location || formData.location,
        notes:
          (parsedData.salary ? `Salary: ${parsedData.salary}\n\n` : "") +
          (parsedData.description || formData.notes),
      })

      // Clear smart paste text and hide the section
      setSmartPasteText("")
      setShowSmartPaste(false)
    } catch (error) {
      console.error("Error parsing job text:", error)
      alert("Failed to parse job text. Please try again or fill in manually.")
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      let locationData = null
      if (formData.location) {
        if (formData.company && formData.location) {
          locationData = await googlePlacesService.geocodeCompanyLocation(formData.company, formData.location)
        }

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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border-0">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1 sm:space-y-2">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">
                Add New Job Application
              </CardTitle>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Track a new job opportunity in your pipeline
              </p>
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
            {showSmartPaste && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm sm:text-base font-bold text-purple-900">AI Smart Paste</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSmartPaste(false)}
                      className="h-6 w-6 p-0 hover:bg-purple-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-700">
                    Copy and paste job posting details from anywhere. AI will automatically extract company, position,
                    location, and more!
                  </p>
                  <Textarea
                    value={smartPasteText}
                    onChange={(e) => setSmartPasteText(e.target.value)}
                    placeholder="Paste job description here... (e.g., 'Google is hiring Senior Software Engineer in Mountain View, CA. Salary: $150k-$200k...')"
                    rows={4}
                    className="resize-none text-sm border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                  <Button
                    type="button"
                    onClick={handleSmartParse}
                    disabled={!smartPasteText.trim() || isParsing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isParsing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Parsing with AI...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Parse with AI
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!showSmartPaste && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSmartPaste(true)}
                className="w-full border-dashed border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Show AI Smart Paste
              </Button>
            )}

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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-6 py-2.5 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  "Add Application"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddJobModal

"use client"

import React from "react"
import { useState, useEffect } from "react"
import type { Job, JobEvent } from "@/lib/types"
import { DataService } from "@/lib/dataService"
import {
  X,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Edit,
  Edit2,
  Trash2,
  FileText,
  Award,
  UserCheck,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmDialog from "./ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "@radix-ui/react-icons"

interface InterviewModalProps {
  job: Job
  onClose: () => void
  onUpdate: () => void
}

const InterviewModal: React.FC<InterviewModalProps> = ({ job, onClose, onUpdate }) => {
  const [jobEvents, setJobEvents] = useState<JobEvent[]>([])
  const [loading, setLoading] = useState(true)
  const interviews = jobEvents.filter((event) => event.eventType === "interview")
  const [newInterview, setNewInterview] = useState({
    round: interviews.length + 1,
    type: "technical" as JobEvent["interviewType"],
    scheduledDate: "",
    interviewLink: "",
    notes: "",
  })
  const [editingInterview, setEditingInterview] = useState<JobEvent | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showNewInterviewForm, setShowNewInterviewForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<JobEvent | null>(null)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc") // desc = newest first, asc = oldest first
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })
  const [newEvent, setNewEvent] = useState({
    eventType: "interview_scheduled" as JobEvent["eventType"],
    eventDate: "",
    title: "",
    description: "",
    notes: "",
  })

  const [isAddingInterview, setIsAddingInterview] = useState(false)
  const [isAddingEvent, setIsAddingEvent] = useState(false)

  const getEventTypeBadgeColor = (eventType: string) => {
    const colors = {
      applied: "bg-blue-100 text-blue-800",
      interview_scheduled: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      interview_result: "bg-indigo-100 text-indigo-800",
      rejected: "bg-red-100 text-red-800",
      offer_received: "bg-green-100 text-green-800",
      offer_accepted: "bg-emerald-100 text-emerald-800",
      withdrawn: "bg-gray-100 text-gray-800",
      ghosted: "bg-orange-100 text-orange-800",
    }
    return colors[eventType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels = {
      applied: "Applied",
      interview_scheduled: "Interview Scheduled",
      interview: "Interview Scheduled",
      interview: "Interview",
      interview_result: "Interview Result",
      rejected: "Rejected",
      offer_received: "Offer Received",
      offer_accepted: "Offer Accepted",
      withdrawn: "Withdrawn",
      ghosted: "Ghosted",
    }
    return labels[eventType as keyof typeof labels] || eventType
  }

  const getEventTypeDotColor = (eventType: string) => {
    const colors = {
      applied: "border-blue-500",
      interview_scheduled: "border-yellow-500",
      interview: "border-purple-500",
      interview_result: "border-indigo-500",
      rejected: "border-red-500",
      offer_received: "border-green-500",
      offer_accepted: "border-emerald-500",
      withdrawn: "border-gray-500",
      ghosted: "border-orange-500",
    }
    return colors[eventType as keyof typeof colors] || "border-blue-500"
  }

  const getSortedEvents = () => {
    return [...jobEvents].sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime()
      const dateB = new Date(b.eventDate).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  useEffect(() => {
    fetchJobEvents()
  }, [job.id])

  // Listen for data source changes
  useEffect(() => {
    const handleDataSourceChange = () => {
      fetchJobEvents()
    }

    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [job.id])

  const fetchJobEvents = async () => {
    try {
      setLoading(true)
      const events = await DataService.fetchJobEvents(job.id)
      setJobEvents(events)
    } catch (error) {
      console.error("Failed to fetch job events:", error)
    } finally {
      setLoading(false)
    }
  }

  const createJobEvent = async (eventData: Partial<JobEvent>) => {
    try {
      const dataToSend = { ...eventData }
      if (dataToSend.eventDate) {
        if (dataToSend.eventDate instanceof Date) {
          // Convert local Date to UTC ISO string for database storage
          dataToSend.eventDate = dataToSend.eventDate.toISOString() as any
        } else if (typeof dataToSend.eventDate === "string") {
          // If it's a local datetime string, convert to UTC
          const localDate = new Date(dataToSend.eventDate)
          dataToSend.eventDate = localDate.toISOString() as any
        }
      }

      await DataService.createJobEvent({
        ...dataToSend,
        jobId: job.id,
      })
      fetchJobEvents()
    } catch (error) {
      console.error("Failed to create job event:", error)
    }
  }

  const addInterview = async () => {
    if (!newInterview.scheduledDate || isAddingInterview) return

    setIsAddingInterview(true)
    try {
      const localDateTimeString = newInterview.scheduledDate
      const localDate = new Date(localDateTimeString + ":00") // Add seconds

      // Create scheduled interview event with current time
      await createJobEvent({
        eventType: "interview_scheduled",
        eventDate: new Date(), // Current time (will be converted to UTC)
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label} Scheduled`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""} scheduled for ${localDateTimeString}`,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewLink: newInterview.interviewLink,
        notes: newInterview.notes,
      })

      await createJobEvent({
        eventType: "interview",
        eventDate: localDate, // Will be converted to UTC in createJobEvent
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label}`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""}`,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewLink: newInterview.interviewLink,
        interviewResult: "pending", // Default to pending
        notes: newInterview.notes,
      })

      setNewInterview({
        round: interviews.length + 2,
        type: "technical",
        scheduledDate: "",
        interviewLink: "",
        notes: "",
      })
      setShowNewInterviewForm(false) // Hide the form after successful creation
      onUpdate() // Call parent update after local state changes
    } catch (error) {
      console.error("Failed to add interview:", error)
    } finally {
      setIsAddingInterview(false)
    }
  }

  const parseLocalDate = (dateString: string): Date | null => {
    if (!dateString) return null

    try {
      const [year, month, day] = dateString.split("-").map(Number)
      return new Date(year, month - 1, day) // Create as local date, month is 0-indexed
    } catch (error) {
      console.warn("Failed to parse local date:", dateString, error)
      return null
    }
  }

  const addCustomEvent = async () => {
    if (!newEvent.eventDate || !newEvent.title || isAddingEvent) return

    setIsAddingEvent(true)
    try {
      const [year, month, day] = newEvent.eventDate.split("-").map(Number)
      const localDate = new Date(year, month - 1, day) // month is 0-indexed
      // localDate will be converted to UTC in createJobEvent

      await createJobEvent({
        eventType: newEvent.eventType,
        eventDate: localDate,
        title: newEvent.title,
        description: newEvent.description,
        notes: newEvent.notes,
      })

      setNewEvent({
        eventType: "interview_scheduled",
        eventDate: "",
        title: "",
        description: "",
        notes: "",
      })
      setShowEventForm(false)
      onUpdate() // Call parent update after local state changes
      fetchJobEvents() // Refresh the local data
    } catch (error) {
      console.error("Failed to add custom event:", error)
    } finally {
      setIsAddingEvent(false)
    }
  }

  const updateEvent = async (eventId: number, updates: Partial<JobEvent>) => {
    try {
      const dataToSend = { ...updates }
      if (dataToSend.eventDate && dataToSend.eventDate instanceof Date) {
        // Convert local Date to UTC ISO string for database storage
        dataToSend.eventDate = dataToSend.eventDate.toISOString() as any
      }

      await DataService.updateJobEvent(eventId, dataToSend)
      onUpdate()
      fetchJobEvents() // Refresh the local data
      setEditingEvent(null)
    } catch (error) {
      console.error("Failed to update event:", error)
    }
  }

  const deleteEvent = async (eventId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await DataService.deleteJobEvent(eventId)
          onUpdate() // Call parent update first
          fetchJobEvents() // Then refresh local data
        } catch (error) {
          console.error("Failed to delete event:", error)
        }
      },
    })
  }

  const deleteInterviewEvents = async (interviewRound: number, interviewType: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Interview",
      message: "Are you sure you want to delete this interview and all related events? This action cannot be undone.",
      onConfirm: async () => {
        try {
          // Delete related events by matching round and type
          const relatedEvents = jobEvents.filter(
            (event) =>
              event.interviewRound === interviewRound &&
              event.interviewType === interviewType &&
              (event.eventType === "interview_scheduled" || event.eventType === "interview"),
          )

          for (const event of relatedEvents) {
            await DataService.deleteJobEvent(event.id!)
          }

          onUpdate() // Call parent update first
          fetchJobEvents() // Then refresh local data
        } catch (error) {
          console.error("Failed to delete interview events:", error)
        }
      },
    })
  }

  const saveEditingInterview = async () => {
    if (!editingInterview || !newInterview.scheduledDate) return

    try {
      // Parse the datetime-local input to create a proper local date
      const [dateStr, timeStr] = newInterview.scheduledDate.split("T")
      const [year, month, day] = dateStr.split("-").map(Number)
      const [hour, minute] = timeStr.split(":").map(Number)
      const scheduledLocalDate = new Date(year, month - 1, day, hour, minute)

      // Convert to local ISO string for the API
      const eventDateToSend = `${scheduledLocalDate.getFullYear()}-${String(scheduledLocalDate.getMonth() + 1).padStart(2, "0")}-${String(scheduledLocalDate.getDate()).padStart(2, "0")}T${String(scheduledLocalDate.getHours()).padStart(2, "0")}:${String(scheduledLocalDate.getMinutes()).padStart(2, "0")}:${String(scheduledLocalDate.getSeconds()).padStart(2, "0")}`

      // Update the interview event with the new form data
      await DataService.updateJobEvent(editingInterview.id!, {
        eventType: editingInterview.eventType,
        eventDate: eventDateToSend as any,
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label}`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""}`,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewLink: newInterview.interviewLink,
        interviewResult: editingInterview.interviewResult,
        notes: newInterview.notes,
      })

      onUpdate() // Call parent update first
      fetchJobEvents() // Then refresh local data
      setEditingInterview(null)
      setShowNewInterviewForm(false)
      setNewInterview({
        round: interviews.length + 1,
        type: "technical",
        scheduledDate: "",
        interviewLink: "",
        notes: "",
      })
    } catch (error) {
      console.error("Failed to update interview:", error)
    }
  }

  const getTypeConfig = (type: string | undefined) => {
    const configs = {
      technical: {
        label: "Technical Interview",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <FileText className="w-4 h-4" />,
      },
      hr: {
        label: "HR Interview",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <User className="w-4 h-4" />,
      },
      phone: {
        label: "Phone Interview",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <MessageSquare className="w-4 h-4" />,
      },
      video: {
        label: "Video Interview",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <Calendar className="w-4 h-4" />,
      },
      onsite: {
        label: "Onsite Interview",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <Award className="w-4 h-4" />,
      },
      final: {
        label: "Final Interview",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <UserCheck className="w-4 h-4" />,
      },
      oa: {
        label: "Online Assessment",
        color: "bg-cyan-50 text-cyan-700 border-cyan-200",
        icon: <FileText className="w-4 h-4" />,
      },
      vo: {
        label: "Virtual Onsite",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <Calendar className="w-4 h-4" />,
      },
    }
    return configs[type as keyof typeof configs] || configs.technical
  }

  const getResultConfig = (result: string | undefined) => {
    const configs = {
      pending: {
        label: "Pending",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
      },
      passed: {
        label: "Passed",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      failed: {
        label: "Failed",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle className="w-4 h-4" />,
      },
      waiting: {
        label: "Waiting",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <AlertCircle className="w-4 h-4" />,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <Pause className="w-4 h-4" />,
      },
    }
    return result ? configs[result as keyof typeof configs] || configs.pending : configs.pending
  }

  const parseScheduledDate = (dateString: string | undefined | null): Date | null => {
    if (!dateString || typeof dateString !== "string") return null

    try {
      // Handle PostgreSQL timestamp format (2025-08-15 08:49:54.628828+00) - this is UTC
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)) {
        // Convert PostgreSQL timestamp to ISO format and parse as UTC
        const isoString = dateString.replace(" ", "T").replace(/\+00$/, "Z")
        const date = new Date(isoString) // This will be interpreted as UTC
        if (!isNaN(date.getTime())) {
          return date // Return UTC date, will be displayed in local time
        }
      }

      // Handle ISO string format (UTC from database)
      const date = new Date(dateString) // This will be interpreted as UTC if it has Z suffix
      if (!isNaN(date.getTime())) {
        return date // Return UTC date, will be displayed in local time
      }

      // Handle datetime-local format (YYYY-MM-DDTHH:MM) - treat as local time
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
        const [datePart, timePart] = dateString.split("T")
        const [year, month, day] = datePart.split("-").map(Number)
        const [hour, minute] = timePart.split(":").map(Number)
        return new Date(year, month - 1, day, hour, minute) // Create as local time
      }

      return null
    } catch (error) {
      console.warn("Failed to parse date:", dateString, error)
      return null
    }
  }

  // Format datetime-local input value from Date object
  const formatDateTimeLocal = (date: Date | null): string => {
    if (!date) return ""

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const deleteInterview = async (interviewId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Interview",
      message: "Are you sure you want to delete this interview and all related events? This action cannot be undone.",
      onConfirm: async () => {
        try {
          // Find the interview event
          const interviewEvent = jobEvents.find((event) => event.id === interviewId)

          if (interviewEvent) {
            // Delete related events by matching round and type (without additional confirmation)
            const relatedEvents = jobEvents.filter(
              (event) =>
                event.interviewRound === interviewEvent.interviewRound &&
                event.interviewType === interviewEvent.interviewType &&
                (event.eventType === "interview_scheduled" || event.eventType === "interview"),
            )

            for (const event of relatedEvents) {
              await DataService.deleteJobEvent(event.id!)
            }

            onUpdate() // Call parent update first
            fetchJobEvents() // Then refresh local data
          } else {
            console.warn("Interview event not found for deletion.")
          }
        } catch (error) {
          console.error("Failed to delete interview events:", error)
        }
      },
    })
  }

  const findInterviewResultEvent = (interviewRound: number, interviewType: string) => {
    return jobEvents.find(
      (event) =>
        event.eventType === "interview_result" &&
        event.interviewRound === interviewRound &&
        event.interviewType === interviewType,
    )
  }

  const updateInterviewResult = async (interviewId: number, newResult: JobEvent["interviewResult"]) => {
    try {
      // Find the interview event to get its details
      const interviewEvent = jobEvents.find((event) => event.id === interviewId)
      if (!interviewEvent) {
        console.error("Interview event not found")
        return
      }

      const currentResult = interviewEvent.interviewResult
      const interviewRound = interviewEvent.interviewRound!
      const interviewType = interviewEvent.interviewType!

      // Update the main interview event
      await DataService.updateJobEvent(interviewId, {
        interviewResult: newResult,
      })

      // Handle state transitions
      if (currentResult === "pending" && newResult !== "pending") {
        // From pending to other status: create interview_result event
        await createJobEvent({
          eventType: "interview_result",
          eventDate: new Date(), // Current time
          title: `Round ${interviewRound} ${getTypeConfig(interviewType).label} - ${newResult.charAt(0).toUpperCase() + newResult.slice(1)}`,
          description: `Interview result: ${newResult}`,
          interviewRound: interviewRound,
          interviewType: interviewType,
          interviewResult: newResult,
        })
      } else if (currentResult !== "pending" && newResult === "pending") {
        // From other status to pending: delete interview_result event
        const resultEvent = findInterviewResultEvent(interviewRound, interviewType)
        if (resultEvent && resultEvent.id) {
          await DataService.deleteJobEvent(resultEvent.id)
        }
      } else if (currentResult !== "pending" && newResult !== "pending") {
        // Between non-pending statuses: update existing interview_result event
        const resultEvent = findInterviewResultEvent(interviewRound, interviewType)
        if (resultEvent && resultEvent.id) {
          await DataService.updateJobEvent(resultEvent.id, {
            interviewResult: newResult,
            title: `Round ${interviewRound} ${getTypeConfig(interviewType).label} - ${newResult.charAt(0).toUpperCase() + newResult.slice(1)}`,
            description: `Interview result: ${newResult}`,
          })
        }
      }

      onUpdate() // Call parent update first
      fetchJobEvents() // Then refresh local data
    } catch (error) {
      console.error("Failed to update interview result:", error)
    }
  }

  const renderInterviewResultBadge = (interview: JobEvent, size: "desktop" | "mobile" = "desktop") => {
    const resultConfig = getResultConfig(interview.interviewResult)
    const badgeClasses =
      size === "desktop"
        ? `${resultConfig.color} border font-medium text-xs w-fit`
        : `${resultConfig.color} border font-medium text-xs w-fit`

    return (
      <Select
        value={interview.interviewResult || "pending"}
        onValueChange={(value) => updateInterviewResult(interview.id!, value as JobEvent["interviewResult"])}
      >
        <SelectTrigger
          className={`${badgeClasses} h-auto px-2 py-1 border-dashed hover:border-solid transition-all cursor-pointer`}
        >
          <div className="flex items-center">
            {resultConfig.icon}
            <span className="ml-1">{resultConfig.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </div>
          </SelectItem>
          <SelectItem value="passed">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Passed
            </div>
          </SelectItem>
          <SelectItem value="failed">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2" />
              Failed
            </div>
          </SelectItem>
          <SelectItem value="cancelled">
            <div className="flex items-center">
              <Pause className="w-4 h-4 mr-2" />
              Cancelled
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="p-2 sm:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-base sm:text-2xl font-bold text-slate-800 tracking-tight">Interview Management</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 text-sm sm:text-base text-slate-600">
                <Badge
                  variant="secondary"
                  className="mr-0 sm:mr-2 px-1.5 sm:px-3 py-1 text-xs sm:text-sm font-medium w-fit"
                >
                  {job.position}
                </Badge>
                <span className="hidden sm:inline text-slate-400">at</span>
                <span className="ml-0 sm:ml-2 font-semibold text-slate-700">{job.company}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 sm:h-10 sm:w-10 rounded-full hover:bg-slate-100 flex-shrink-0"
            >
              <X className="w-3 h-3 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <div className="mb-4 sm:mb-8">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4 flex-wrap">
              <h3 className="text-base sm:text-xl font-semibold text-slate-800">Interview Rounds</h3>
              {!showNewInterviewForm && !loading && (
                <Button
                  onClick={() => setShowNewInterviewForm(true)}
                  size="sm"
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Schedule Interview</span>
                </Button>
              )}
            </div>

            {loading ? (
              <Card className="border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600">Loading interview data...</p>
                </CardContent>
              </Card>
            ) : interviews.length === 0 && !showNewInterviewForm ? (
              <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No interviews scheduled</h3>
                  <p className="text-slate-500 mb-6 max-w-md">
                    Start tracking your interview process by scheduling your first interview round.
                  </p>
                  <Button
                    onClick={() => setShowNewInterviewForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule First Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden md:flex md:items-center md:gap-4">
                  {interviews
                    .sort((a, b) => (a.interviewRound || 1) - (b.interviewRound || 1)) // Desktop: ascending order
                    .map((interview, index, sortedArray) => (
                      <React.Fragment key={interview.id}>
                        <Card className="border-slate-200 hover:border-slate-300 transition-colors flex-1">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                  {interview.interviewRound || 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base text-slate-800 mb-1">
                                    Round {interview.interviewRound || 1}
                                  </CardTitle>

                                  <div className="flex flex-col gap-2 mb-2">
                                    <Badge
                                      className={`${getTypeConfig(interview.interviewType).color} border font-medium text-xs w-fit`}
                                    >
                                      {getTypeConfig(interview.interviewType).icon}
                                      <span className="ml-1">{getTypeConfig(interview.interviewType).label}</span>
                                    </Badge>
                                    {renderInterviewResultBadge(interview, "desktop")}
                                  </div>

                                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                                    <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                    <span>
                                      {(() => {
                                        try {
                                          return interview.eventDate
                                            ? format(new Date(interview.eventDate), "EEE, MMM d, h:mm a")
                                            : "Not scheduled"
                                        } catch (error) {
                                          console.warn("Failed to format interview date:", interview.eventDate, error)
                                          return "Invalid date"
                                        }
                                      })()}
                                    </span>
                                  </div>

                                  {interview.notes && (
                                    <p className="text-xs text-slate-600 line-clamp-2">{interview.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-slate-100"
                                  onClick={() => {
                                    // Populate the form with existing interview data
                                    try {
                                      const eventDate = new Date(interview.eventDate)
                                      if (isNaN(eventDate.getTime())) {
                                        console.warn("Invalid interview date:", interview.eventDate)
                                        return
                                      }
                                      const formattedDate = formatDateTimeLocal(eventDate)

                                      setNewInterview({
                                        round: interview.interviewRound || 1,
                                        type: interview.interviewType || "technical",
                                        scheduledDate: formattedDate,
                                        interviewLink: interview.interviewLink || "",
                                        notes: interview.notes || "",
                                      })
                                      setEditingInterview(interview)
                                      setShowNewInterviewForm(true)
                                    } catch (error) {
                                      console.error("Failed to edit interview:", error)
                                    }
                                  }}
                                >
                                  <Edit2 className="h-3 w-3 text-slate-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => deleteInterview(interview.id!)}
                                >
                                  <Trash2 className="h-3 w-3 text-slate-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {index < sortedArray.length - 1 && (
                          <div className="flex items-center justify-center">
                            <ChevronRight className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                </div>

                <div className="md:hidden space-y-2">
                  {interviews
                    .sort((a, b) => (b.interviewRound || 1) - (a.interviewRound || 1)) // Mobile: descending order
                    .map((interview) => (
                      <Card key={interview.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                        <CardContent className="p-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                                {interview.interviewRound || 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-sm text-slate-800 mb-0.5">
                                  Round {interview.interviewRound || 1}
                                </CardTitle>

                                <div className="flex flex-col gap-1 mb-1">
                                  <Badge
                                    className={`${getTypeConfig(interview.interviewType).color} border font-medium text-xs w-fit`}
                                  >
                                    {getTypeConfig(interview.interviewType).icon}
                                    <span className="ml-1">{getTypeConfig(interview.interviewType).label}</span>
                                  </Badge>
                                  {renderInterviewResultBadge(interview, "mobile")}
                                </div>

                                <div className="flex items-center gap-1 text-xs text-slate-600">
                                  <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                  <span>
                                    {(() => {
                                      try {
                                        return interview.eventDate
                                          ? format(new Date(interview.eventDate), "EEE, MMM d, h:mm a")
                                          : "Not scheduled"
                                      } catch (error) {
                                        console.warn("Failed to format interview date:", interview.eventDate, error)
                                        return "Invalid date"
                                      }
                                    })()}
                                  </span>
                                </div>

                                {interview.notes && (
                                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{interview.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-slate-100"
                                onClick={() => {
                                  // Populate the form with existing interview data
                                  try {
                                    const eventDate = new Date(interview.eventDate)
                                    if (isNaN(eventDate.getTime())) {
                                      console.warn("Invalid interview date:", interview.eventDate)
                                      return
                                    }
                                    const formattedDate = formatDateTimeLocal(eventDate)

                                    setNewInterview({
                                      round: interview.interviewRound || 1,
                                      type: interview.interviewType || "technical",
                                      scheduledDate: formattedDate,
                                      interviewLink: interview.interviewLink || "",
                                      notes: interview.notes || "",
                                    })
                                    setEditingInterview(interview)
                                    setShowNewInterviewForm(true)
                                  } catch (error) {
                                    console.error("Failed to edit interview:", error)
                                  }
                                }}
                              >
                                <Edit2 className="h-3 w-3 text-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={() => deleteInterview(interview.id!)}
                              >
                                <Trash2 className="h-3 w-3 text-slate-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            )}
          </div>

          {showNewInterviewForm && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div>
                    <CardTitle className="text-sm sm:text-lg text-slate-800">
                      {editingInterview ? "Edit Interview" : "Schedule New Interview"}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {editingInterview ? "Update interview details" : "Add a new interview round to your application"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewInterviewForm(false)}
                    className="h-6 w-6 sm:h-8 sm:w-8 self-end sm:self-auto"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="round" className="text-xs sm:text-sm font-medium text-slate-700">
                      Round Number
                    </Label>
                    <Input
                      id="round"
                      type="number"
                      value={newInterview.round}
                      onChange={(e) => setNewInterview({ ...newInterview, round: Number.parseInt(e.target.value) })}
                      className="h-9 sm:h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="type" className="text-xs sm:text-sm font-medium text-slate-700">
                      Interview Type
                    </Label>
                    <Select
                      value={newInterview.type}
                      onValueChange={(value) =>
                        setNewInterview({ ...newInterview, type: value as JobEvent["interviewType"] })
                      }
                    >
                      <SelectTrigger className="h-9 sm:h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Interview</SelectItem>
                        <SelectItem value="hr">HR Interview</SelectItem>
                        <SelectItem value="phone">Phone Interview</SelectItem>
                        <SelectItem value="video">Video Interview</SelectItem>
                        <SelectItem value="onsite">Onsite Interview</SelectItem>
                        <SelectItem value="final">Final Interview</SelectItem>
                        <SelectItem value="oa">Online Assessment</SelectItem>
                        <SelectItem value="vo">Virtual Onsite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="scheduledDate" className="text-xs sm:text-sm font-medium text-slate-700">
                      Scheduled Date & Time
                    </Label>
                    <div className="flex gap-1 sm:gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 sm:h-11 flex-1 justify-start text-left font-normal border-slate-300 focus:border-blue-500",
                              !newInterview.scheduledDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {(() => {
                              const parsedDate = parseScheduledDate(newInterview.scheduledDate)
                              return parsedDate ? format(parsedDate, "PPP") : "Pick a date"
                            })()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={parseScheduledDate(newInterview.scheduledDate) || undefined}
                            onSelect={(date) => {
                              if (date) {
                                const currentTime = (() => {
                                  const parsedDate = parseScheduledDate(newInterview.scheduledDate)
                                  return parsedDate
                                    ? `${String(parsedDate.getHours()).padStart(2, "0")}:${String(parsedDate.getMinutes()).padStart(2, "0")}`
                                    : "09:00"
                                })()
                                const dateTimeString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${currentTime}`
                                setNewInterview({ ...newInterview, scheduledDate: dateTimeString })
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={(() => {
                          const parsedDate = parseScheduledDate(newInterview.scheduledDate)
                          return parsedDate
                            ? `${String(parsedDate.getHours()).padStart(2, "0")}:${String(parsedDate.getMinutes()).padStart(2, "0")}`
                            : "09:00"
                        })()}
                        onChange={(e) => {
                          const currentDate = parseScheduledDate(newInterview.scheduledDate) || new Date()
                          const dateTimeString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}T${e.target.value}`
                          setNewInterview({ ...newInterview, scheduledDate: dateTimeString })
                        }}
                        className="w-24 sm:w-32 h-9 sm:h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="interviewLink" className="text-xs sm:text-sm font-medium text-slate-700">
                      Interview Link
                    </Label>
                    <Input
                      id="interviewLink"
                      type="text"
                      value={newInterview.interviewLink}
                      onChange={(e) => setNewInterview({ ...newInterview, interviewLink: e.target.value })}
                      placeholder="Meeting link, phone number, or location"
                      className="h-9 sm:h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="notes" className="text-xs sm:text-sm font-medium text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newInterview.notes}
                    onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                    placeholder="Preparation notes, topics to discuss, etc..."
                    rows={2}
                    className="h-16 sm:h-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewInterviewForm(false)
                      setEditingInterview(null)
                      setNewInterview({
                        round: interviews.length + 1,
                        type: "technical",
                        scheduledDate: "",
                        interviewLink: "",
                        notes: "",
                      })
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                    disabled={isAddingInterview}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={editingInterview ? saveEditingInterview : addInterview}
                    disabled={isAddingInterview || !newInterview.scheduledDate}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingInterview ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {editingInterview ? "Updating..." : "Scheduling..."}
                      </div>
                    ) : editingInterview ? (
                      "Update Interview"
                    ) : (
                      "Schedule Interview"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Added clear dividing line between sections */}
          <div className="border-t-2 border-slate-200 my-6 sm:my-8"></div>

          <Card className="border-slate-200">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base sm:text-xl font-semibold text-slate-800">Event Timeline</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Track all events related to this job application</p>
                </div>
                <div className="flex flex-row gap-2 items-center justify-end flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                    className="border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-transparent px-3 py-1"
                    disabled={loading}
                    aria-label={sortOrder === "desc" ? "Sort: Newest first" : "Sort: Oldest first"}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-0" />
                    <span className="hidden sm:inline ml-2">
                      {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                    </span>
                  </Button>
                  {!showEventForm && !loading && (
                    <Button
                      onClick={() => setShowEventForm(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                      aria-label="Add event"
                    >
                      <Plus className="w-4 h-4 mr-0" />
                      <span className="hidden sm:inline ml-2 text-sm">Add Event</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {loading ? (
              <Card className="border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200"></div>
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 text-sm">Loading events...</p>
                </CardContent>
              </Card>
            ) : getSortedEvents().length === 0 && !showEventForm ? (
              <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No events recorded yet</h3>
                  <p className="text-slate-500 mb-6 max-w-md">
                    Start tracking your application process by adding your first event.
                  </p>
                  <Button onClick={() => setShowEventForm(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <CardContent className="space-y-6">
                {/* Custom Event Form */}
                {showEventForm && (
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-800">Add Custom Event</CardTitle>
                      <CardDescription>Record important milestones in your application process</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eventType" className="text-sm font-medium text-slate-700">
                            Event Type
                          </Label>
                          <Select
                            value={newEvent.eventType}
                            onValueChange={(value) =>
                              setNewEvent({ ...newEvent, eventType: value as JobEvent["eventType"] })
                            }
                          >
                            <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="interview_result">Interview Result</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="offer_received">Offer Received</SelectItem>
                              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                              <SelectItem value="withdrawn">Withdrawn</SelectItem>
                              <SelectItem value="ghosted">Ghosted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventDate" className="text-sm font-medium text-slate-700">
                            Event Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal border-slate-300 focus:border-green-500",
                                  !newEvent.eventDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEvent.eventDate
                                  ? format(parseLocalDate(newEvent.eventDate) || new Date(), "PPP")
                                  : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={
                                  newEvent.eventDate ? parseLocalDate(newEvent.eventDate) || undefined : undefined
                                }
                                onSelect={(date) => {
                                  if (date) {
                                    const year = date.getFullYear()
                                    const month = String(date.getMonth() + 1).padStart(2, "0")
                                    const day = String(date.getDate()).padStart(2, "0")
                                    setNewEvent({ ...newEvent, eventDate: `${year}-${month}-${day}` })
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="eventTitle" className="text-sm font-medium text-slate-700">
                            Title
                          </Label>
                          <Input
                            id="eventTitle"
                            type="text"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            placeholder="Event title"
                            className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="eventDescription" className="text-sm font-medium text-slate-700">
                            Description
                          </Label>
                          <Input
                            id="eventDescription"
                            type="text"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            placeholder="Event description"
                            className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowEventForm(false)
                            setEditingEvent(null)
                            setNewEvent({
                              eventType: "interview_scheduled",
                              eventDate: "",
                              title: "",
                              description: "",
                              notes: "",
                            })
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                          disabled={isAddingEvent}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={editingEvent ? () => updateEvent(editingEvent.id!, newEvent) : addCustomEvent}
                          disabled={isAddingEvent || !newEvent.eventDate || !newEvent.title}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingEvent ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              {editingEvent ? "Updating..." : "Adding..."}
                            </div>
                          ) : editingEvent ? (
                            "Update Event"
                          ) : (
                            "Add Event"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Edit Event Form */}
                {editingEvent && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-800">Edit Event</CardTitle>
                      <CardDescription>Update event details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editEventType" className="text-sm font-medium text-slate-700">
                            Event Type
                          </Label>
                          <Select
                            value={editingEvent.eventType}
                            onValueChange={(value) =>
                              setEditingEvent({ ...editingEvent, eventType: value as JobEvent["eventType"] })
                            }
                          >
                            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="interview_result">Interview Result</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="offer_received">Offer Received</SelectItem>
                              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                              <SelectItem value="withdrawn">Withdrawn</SelectItem>
                              <SelectItem value="ghosted">Ghosted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editEventDate" className="text-sm font-medium text-slate-700">
                            Event Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal border-slate-300 focus:border-blue-500",
                                  !editingEvent.eventDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {(() => {
                                  try {
                                    return editingEvent.eventDate
                                      ? format(new Date(editingEvent.eventDate), "PPP")
                                      : "Pick a date"
                                  } catch (error) {
                                    console.warn("Failed to format editing event date:", editingEvent.eventDate, error)
                                    return "Pick a date"
                                  }
                                })()}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={editingEvent.eventDate ? new Date(editingEvent.eventDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setEditingEvent({ ...editingEvent, eventDate: date })
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="editEventTitle" className="text-sm font-medium text-slate-700">
                            Title
                          </Label>
                          <Input
                            id="editEventTitle"
                            type="text"
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            placeholder="Event title"
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="editEventDescription" className="text-sm font-medium text-slate-700">
                            Description
                          </Label>
                          <Input
                            id="editEventDescription"
                            type="text"
                            value={editingEvent.description || ""}
                            onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            placeholder="Event description"
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="editEventNotes" className="text-sm font-medium text-slate-700">
                            Notes
                          </Label>
                          <Textarea
                            id="editEventNotes"
                            value={editingEvent.notes || ""}
                            onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                            placeholder="Additional notes"
                            rows={2}
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => updateEvent(editingEvent.id!, editingEvent)}
                          disabled={!editingEvent.eventDate || !editingEvent.title}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Update Event
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingEvent(null)}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Added clear dividing line before event list */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="relative">
                    {jobEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 italic">No events recorded yet</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-400 to-pink-300"></div>

                        <div className="space-y-4">
                          {getSortedEvents().map((event, index) => (
                            <div key={event.id} className="relative">
                              <Card className="border-slate-100 hover:border-slate-200 transition-all duration-200 ml-12 hover:shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeBadgeColor(event.eventType)}`}
                                      >
                                        {getEventTypeLabel(event.eventType)}
                                      </span>
                                      <span className="text-xs right-0 text-slate-500 font-medium">
                                        {(() => {
                                          try {
                                            return new Date(event.eventDate).toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          } catch (error) {
                                            console.warn("Failed to format event date:", event.eventDate, error)
                                            return "Invalid date"
                                          }
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingEvent(event)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteEvent(event.id!)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-3">
                                    <div className="flex-grow min-w-0">
                                      <h5 className="text-sm font-semibold text-slate-800 mb-1">{event.title}</h5>
                                      {event.description && (
                                        <p className="text-sm text-slate-600 mb-1">{event.description}</p>
                                      )}
                                      {event.notes && <p className="text-xs text-slate-500">{event.notes}</p>}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <div
                                className={`absolute w-3 h-3 border-2 rounded-full bg-white shadow-sm ${getEventTypeDotColor(event.eventType)}`}
                                style={{ left: "calc(1.5rem + 1px)", top: "1.5rem", transform: "translateX(-50%)" }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default InterviewModal

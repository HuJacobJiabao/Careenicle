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
      const events = await DataService.fetchJobEvents(job.id)
      setJobEvents(events)
    } catch (error) {
      console.error("Failed to fetch job events:", error)
    }
  }

  const createJobEvent = async (eventData: Partial<JobEvent>) => {
    try {
      // Convert Date objects to local ISO strings to avoid timezone issues
      const dataToSend = { ...eventData }
      if (dataToSend.eventDate && dataToSend.eventDate instanceof Date) {
        // Create local ISO string without timezone conversion
        const date = dataToSend.eventDate
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        dataToSend.eventDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}` as any
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
    if (!newInterview.scheduledDate) return

    // Parse the datetime-local input to create a proper local date
    const [dateStr, timeStr] = newInterview.scheduledDate.split("T")
    const [year, month, day] = dateStr.split("-").map(Number)
    const [hour, minute] = timeStr.split(":").map(Number)
    const scheduledLocalDate = new Date(year, month - 1, day, hour, minute)

    try {
      // Create scheduled interview event with current time
      await createJobEvent({
        eventType: "interview_scheduled",
        eventDate: new Date(), // Current time
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label} Scheduled`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""} scheduled for ${scheduledLocalDate.toLocaleString()}`,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewLink: newInterview.interviewLink,
        notes: newInterview.notes,
      })

      // Create the actual interview event with the scheduled time
      await createJobEvent({
        eventType: "interview",
        eventDate: scheduledLocalDate,
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label}`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""}`,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewLink: newInterview.interviewLink,
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
    }
  }

  const addCustomEvent = async () => {
    if (!newEvent.eventDate || !newEvent.title) return

    try {
      // Create a local date without timezone conversion
      const [year, month, day] = newEvent.eventDate.split("-").map(Number)
      const localDate = new Date(year, month - 1, day) // month is 0-indexed

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
    }
  }

  const updateEvent = async (eventId: number, updates: Partial<JobEvent>) => {
    try {
      // Convert Date objects to local ISO strings to avoid timezone issues
      const dataToSend = { ...updates }
      if (dataToSend.eventDate && dataToSend.eventDate instanceof Date) {
        const date = dataToSend.eventDate
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        dataToSend.eventDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}` as any
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl animate-scale-in">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-slate-800 tracking-tight">Interview Management</h2>
              <div className="flex items-center text-lg text-slate-600">
                <Badge variant="secondary" className="mr-2 px-3 py-1 text-sm font-medium">
                  {job.position}
                </Badge>
                <span className="text-slate-400">at</span>
                <span className="ml-2 font-semibold text-slate-700">{job.company}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-slate-800">Interview Rounds</h3>
              {!showNewInterviewForm && (
                <Button
                  onClick={() => setShowNewInterviewForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule New Interview
                </Button>
              )}
            </div>

            {interviews.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="w-16 h-16 text-slate-400 mb-4" />
                  <CardTitle className="text-xl text-slate-600 mb-2">No interviews scheduled yet</CardTitle>
                  <CardDescription className="text-slate-500">Add your first interview below</CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {(() => {
                    const sortedInterviews = interviews.sort(
                      (a, b) => (a.interviewRound || 0) - (b.interviewRound || 0),
                    )
                    const rows = []

                    // Calculate consistent card width based on maximum 3 cards per row
                    const maxCardsPerRow = 3
                    const arrowWidth = 40 // 24px icon + 16px margin
                    const gapWidth = 16 // gap between elements
                    const maxArrowsPerRow = maxCardsPerRow - 1 // arrows between cards
                    const totalArrowAndGapWidth = maxArrowsPerRow * arrowWidth + maxArrowsPerRow * gapWidth
                    const cardWidth = `calc((100% - ${totalArrowAndGapWidth}px) / ${maxCardsPerRow})`

                    // Group interviews into rows of maximum 3
                    for (let i = 0; i < sortedInterviews.length; i += 3) {
                      const rowInterviews = sortedInterviews.slice(i, i + 3)
                      const isLastRow = i + 3 >= sortedInterviews.length
                      const hasMoreInterviews = !isLastRow

                      rows.push(
                        <div key={`row-${i}`} className="flex items-center justify-start gap-4 overflow-hidden">
                          {rowInterviews.map((interview, index) => {
                            const typeConfig = getTypeConfig(interview.interviewType || "technical")
                            const resultConfig = getResultConfig(interview.interviewResult || "pending")
                            const isEditing = editingInterview?.id === interview.id && !showNewInterviewForm

                            return (
                              <React.Fragment key={interview.id}>
                                <Card
                                  className="hover:shadow-lg transition-all duration-200 border-slate-200 flex-shrink-0"
                                  style={{ width: cardWidth, maxWidth: cardWidth }}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                          {interview.interviewRound || 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <CardTitle className="text-base text-slate-800">
                                            Round {interview.interviewRound || 1}
                                          </CardTitle>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // Populate the form with existing interview data
                                            const eventDate = new Date(interview.eventDate)
                                            const formattedDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}T${String(eventDate.getHours()).padStart(2, "0")}:${String(eventDate.getMinutes())}`

                                            setNewInterview({
                                              round: interview.interviewRound || 1,
                                              type: interview.interviewType || "technical",
                                              scheduledDate: formattedDate,
                                              interviewLink: interview.interviewLink || "",
                                              notes: interview.notes || "",
                                            })
                                            setEditingInterview(interview)
                                            setShowNewInterviewForm(true)
                                          }}
                                          className="text-slate-600 hover:text-blue-600 h-6 w-6 p-0"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteInterview(interview.id!)}
                                          className="text-slate-600 hover:text-red-600 h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>

                                  {!isEditing && (
                                    <CardContent className="pt-0 space-y-3">
                                      {/* Type and Result Badges */}
                                      <div className="flex flex-col space-y-2">
                                        <Badge className={`${typeConfig.color} border font-medium text-xs w-fit`}>
                                          {typeConfig.icon}
                                          <span className="ml-1">{typeConfig.label}</span>
                                        </Badge>
                                        <Select
                                          value={interview.interviewResult || "pending"}
                                          onValueChange={(value) =>
                                            updateEvent(interview.id!, { interviewResult: value as any })
                                          }
                                        >
                                          <SelectTrigger
                                            className={`w-fit h-6 text-xs border-0 ${resultConfig.color} font-medium px-2 rounded-full`}
                                          >
                                            <div className="flex items-center">
                                              {resultConfig.icon}
                                              <span className="ml-1">{resultConfig.label}</span>
                                            </div>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="passed">Passed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="waiting">Waiting</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Date and Link */}
                                      <div className="space-y-2 text-xs">
                                        <div className="flex items-center text-slate-600">
                                          <Calendar className="w-3 h-3 mr-2 text-slate-400" />
                                          <span className="truncate">
                                            {new Date(interview.eventDate).toLocaleString("en-US", {
                                              weekday: "short",
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                        {interview.interviewLink && (
                                          <div className="flex items-center text-slate-600">
                                            <MessageSquare className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                                            <a
                                              href={interview.interviewLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-800 hover:underline truncate text-xs"
                                            >
                                              Interview Link
                                            </a>
                                          </div>
                                        )}
                                      </div>

                                      {/* Notes */}
                                      {interview.notes && (
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                          <p className="text-xs text-slate-600 line-clamp-2">{interview.notes}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  )}
                                </Card>

                                {(index < rowInterviews.length - 1 ||
                                  (hasMoreInterviews && index === rowInterviews.length - 1)) && (
                                  <div className="flex items-center justify-center flex-shrink-0 w-6">
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </div>,
                      )
                    }

                    return rows
                  })()}
                </div>
              </div>
            )}
          </div>

          {showNewInterviewForm && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-800">
                      {editingInterview ? "Edit Interview" : "Schedule New Interview"}
                    </CardTitle>
                    <CardDescription>
                      {editingInterview ? "Update interview details" : "Add a new interview round to your application"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewInterviewForm(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="round" className="text-sm font-medium text-slate-700">
                      Round Number
                    </Label>
                    <Input
                      id="round"
                      type="number"
                      value={newInterview.round}
                      onChange={(e) => setNewInterview({ ...newInterview, round: Number.parseInt(e.target.value) })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-slate-700">
                      Interview Type
                    </Label>
                    <Select
                      value={newInterview.type}
                      onValueChange={(value) =>
                        setNewInterview({ ...newInterview, type: value as JobEvent["interviewType"] })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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

                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="text-sm font-medium text-slate-700">
                      Scheduled Date & Time
                    </Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal border-slate-300 focus:border-blue-500",
                              !newInterview.scheduledDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newInterview.scheduledDate
                              ? format(new Date(newInterview.scheduledDate), "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newInterview.scheduledDate ? new Date(newInterview.scheduledDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const currentTime = newInterview.scheduledDate
                                  ? new Date(newInterview.scheduledDate).toTimeString().slice(0, 5)
                                  : "09:00"
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
                        value={
                          newInterview.scheduledDate
                            ? new Date(newInterview.scheduledDate).toTimeString().slice(0, 5)
                            : "09:00"
                        }
                        onChange={(e) => {
                          const currentDate = newInterview.scheduledDate
                            ? new Date(newInterview.scheduledDate)
                            : new Date()
                          const dateTimeString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}T${e.target.value}`
                          setNewInterview({ ...newInterview, scheduledDate: dateTimeString })
                        }}
                        className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interviewLink" className="text-sm font-medium text-slate-700">
                      Interview Link
                    </Label>
                    <Input
                      id="interviewLink"
                      type="text"
                      value={newInterview.interviewLink}
                      onChange={(e) => setNewInterview({ ...newInterview, interviewLink: e.target.value })}
                      placeholder="Meeting link, phone number, or location"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newInterview.notes}
                    onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                    placeholder="Preparation notes, topics to discuss, etc..."
                    rows={3}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={editingInterview ? saveEditingInterview : addInterview}
                    disabled={!newInterview.scheduledDate}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {editingInterview ? "Update Interview" : "Schedule Interview"}
                  </Button>
                  <Button
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
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Added clear dividing line between sections */}
          <div className="border-t-2 border-slate-200 my-8"></div>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-800">Event Timeline</CardTitle>
                  <CardDescription>Track all events related to this job application</CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Sort Button */}
                  <Button
                    variant="outline"
                    onClick={toggleSortOrder}
                    className="flex items-center space-x-2 border-slate-300 hover:border-slate-400 bg-transparent"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm">{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                  </Button>
                  {/* Made Add Event button solid like Schedule New Interview */}
                  <Button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </div>
            </CardHeader>

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
                            <SelectItem value="interview">Interview Completed</SelectItem>
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
                              {newEvent.eventDate ? format(new Date(newEvent.eventDate), "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={newEvent.eventDate ? new Date(newEvent.eventDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setNewEvent({ ...newEvent, eventDate: date.toISOString().split("T")[0] })
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
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={addCustomEvent}
                        disabled={!newEvent.eventDate || !newEvent.title}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowEventForm(false)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
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
                            <SelectItem value="interview">Interview Completed</SelectItem>
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
                              {editingEvent.eventDate ? format(new Date(editingEvent.eventDate), "PPP") : "Pick a date"}
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
                                    <span className="text-xs text-slate-500 font-medium">
                                      {new Date(event.eventDate).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
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

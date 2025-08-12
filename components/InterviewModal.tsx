"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, JobEvent } from "@/lib/types"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

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
  const [newEvent, setNewEvent] = useState({
    eventType: "interview_scheduled" as JobEvent["eventType"],
    eventDate: "",
    title: "",
    description: "",
    notes: "",
  })

  useEffect(() => {
    fetchJobEvents()
  }, [job.id])

  const fetchJobEvents = async () => {
    try {
      const response = await fetch(`/api/job-events?jobId=${job.id}`)
      const events = await response.json()
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

      await fetch("/api/job-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dataToSend,
          jobId: job.id,
        }),
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

      await fetch(`/api/job-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })
      onUpdate()
      fetchJobEvents() // Refresh the local data
      setEditingEvent(null)
    } catch (error) {
      console.error("Failed to update event:", error)
    }
  }

  const deleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      await fetch(`/api/job-events/${eventId}`, {
        method: "DELETE",
      })
      onUpdate() // Call parent update first
      fetchJobEvents() // Then refresh local data
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const deleteInterviewEvents = async (interviewRound: number, interviewType: string) => {
    if (!confirm("Are you sure you want to delete this interview and all related events?")) return

    try {
      // Delete related events by matching round and type
      const relatedEvents = jobEvents.filter(
        (event) =>
          event.interviewRound === interviewRound &&
          event.interviewType === interviewType &&
          (event.eventType === "interview_scheduled" || event.eventType === "interview"),
      )

      for (const event of relatedEvents) {
        await fetch(`/api/job-events/${event.id}`, {
          method: "DELETE",
        })
      }

      onUpdate() // Call parent update first
      fetchJobEvents() // Then refresh local data
    } catch (error) {
      console.error("Failed to delete interview events:", error)
    }
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
      await fetch(`/api/job-events/${editingInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: editingInterview.eventType,
          eventDate: eventDateToSend,
          title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label}`,
          description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewLink ? ` - ${newInterview.interviewLink}` : ""}`,
          interviewRound: newInterview.round,
          interviewType: newInterview.type,
          interviewLink: newInterview.interviewLink,
          interviewResult: editingInterview.interviewResult,
          notes: newInterview.notes,
        }),
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
    return result ? configs[result] : configs.pending
  }

  const deleteInterview = async (interviewId: number) => {
    if (!confirm("Are you sure you want to delete this interview and all related events?")) return

    try {
      // Find the interview event
      const interviewEvent = jobEvents.find((event) => event.id === interviewId)

      if (interviewEvent) {
        // Delete related events by matching round and type
        await deleteInterviewEvents(interviewEvent.interviewRound!, interviewEvent.interviewType!)
      } else {
        console.warn("Interview event not found for deletion.")
      }

      onUpdate() // Call parent update first
      fetchJobEvents() // Then refresh local data
    } catch (error) {
      console.error("Failed to delete interview events:", error)
    }
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
              <div className="grid gap-6">
                {interviews.map((interview) => {
                  const typeConfig = getTypeConfig(interview.interviewType || "technical")
                  const resultConfig = getResultConfig(interview.interviewResult || "pending")
                  const isEditing = editingInterview?.id === interview.id && !showNewInterviewForm

                  return (
                    <Card key={interview.id} className="hover:shadow-lg transition-all duration-200 border-slate-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {interview.interviewRound || 1}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-slate-800">
                                Round {interview.interviewRound || 1}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`${typeConfig.color} border font-medium`}>
                                  {typeConfig.icon}
                                  <span className="ml-1">{typeConfig.label}</span>
                                </Badge>
                                <Badge className={`${resultConfig.color} border font-medium`}>
                                  {resultConfig.icon}
                                  <span className="ml-1">{resultConfig.label}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Populate the form with existing interview data
                                const eventDate = new Date(interview.eventDate)
                                const formattedDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}T${String(eventDate.getHours()).padStart(2, "0")}:${String(eventDate.getMinutes()).padStart(2, "0")}`

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
                              className="text-slate-600 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInterview(interview.id!)}
                              className="text-slate-600 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {!isEditing && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-slate-600">
                              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                              <span>
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
                                <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                                <a
                                  href={interview.interviewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                                >
                                  Interview Link
                                </a>
                              </div>
                            )}
                          </div>
                          {interview.notes && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm text-slate-600">{interview.notes}</p>
                            </div>
                          )}

                          {/* Added interview result status change functionality */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">Interview Result:</span>
                              <Select
                                value={interview.interviewResult || "pending"}
                                onValueChange={(value) => updateEvent(interview.id!, { interviewResult: value as any })}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
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
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
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
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={newInterview.scheduledDate}
                      onChange={(e) => setNewInterview({ ...newInterview, scheduledDate: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
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
                {/* Made Add Event button solid like Schedule New Interview */}
                <Button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
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
                        <Input
                          id="eventDate"
                          type="date"
                          value={newEvent.eventDate}
                          onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                          className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                        />
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
                        <Input
                          id="editEventDate"
                          type="date"
                          value={(() => {
                            const date = new Date(editingEvent.eventDate)
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            return `${year}-${month}-${day}`
                          })()}
                          onChange={(e) => {
                            const [year, month, day] = e.target.value.split("-").map(Number)
                            const localDate = new Date(year, month - 1, day)
                            setEditingEvent({ ...editingEvent, eventDate: localDate })
                          }}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
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
                <div className="space-y-3">
                  {jobEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 italic">No events recorded yet</p>
                    </div>
                  ) : (
                    jobEvents
                      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                      .map((event) => (
                        <Card key={event.id} className="border-slate-100 hover:border-slate-200 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-semibold text-slate-800">{event.title}</h5>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-slate-500 font-medium">
                                      {new Date(event.eventDate).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <div className="flex space-x-1">
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
                                </div>
                                {event.description && (
                                  <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                                )}
                                {event.notes && <p className="text-xs text-slate-500 mt-1">{event.notes}</p>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default InterviewModal

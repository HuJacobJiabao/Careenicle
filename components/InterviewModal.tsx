"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview, JobEvent } from "@/lib/types"
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
  UserX,
} from "lucide-react"

interface InterviewModalProps {
  job: Job
  onClose: () => void
  onUpdate: () => void
}

const InterviewModal: React.FC<InterviewModalProps> = ({ job, onClose, onUpdate }) => {
  const [jobEvents, setJobEvents] = useState<JobEvent[]>([])
  const interviews = jobEvents.filter(event => 
    event.eventType === 'interview_scheduled' || event.eventType === 'interview_completed'
  )
  const [newInterview, setNewInterview] = useState({
    round: interviews.length + 1,
    type: "technical" as Interview["type"],
    scheduledDate: "",
    interviewer: "",
    notes: "",
  })
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
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
      await fetch("/api/job-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventData,
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

    try {
      // Create the interview
      const interviewResponse = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newInterview,
          jobId: job.id,
          result: "pending",
        }),
      })
      
      const interview = await interviewResponse.json()

      // Create corresponding job event for scheduled interview
      await createJobEvent({
        eventType: "interview_scheduled",
        eventDate: new Date(newInterview.scheduledDate),
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label} Scheduled`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewer ? ` with ${newInterview.interviewer}` : ""}`,
        interviewId: interview.id,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewer: newInterview.interviewer,
        notes: newInterview.notes,
      })

      // Also create a corresponding interview_completed event for timeline
      await createJobEvent({
        eventType: "interview_completed",
        eventDate: new Date(newInterview.scheduledDate),
        title: `Round ${newInterview.round} ${getTypeConfig(newInterview.type).label}`,
        description: `${getTypeConfig(newInterview.type).label}${newInterview.interviewer ? ` with ${newInterview.interviewer}` : ""}`,
        interviewId: interview.id,
        interviewRound: newInterview.round,
        interviewType: newInterview.type,
        interviewer: newInterview.interviewer,
        notes: newInterview.notes,
      })

      onUpdate()
      setNewInterview({
        round: interviews.length + 2,
        type: "technical",
        scheduledDate: "",
        interviewer: "",
        notes: "",
      })
    } catch (error) {
      console.error("Failed to add interview:", error)
    }
  }

  const updateJobEvent = async (eventId: number, updates: Partial<JobEvent>) => {
    try {
      const response = await fetch(`/api/job-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        await fetchJobEvents()
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to update job event:", error)
    }
  }

  // Helper function to safely update editing interview
  const updateEditingInterview = (updates: Partial<Interview>) => {
    if (!editingInterview) return
    setEditingInterview(prev => {
      if (!prev) return null
      return {
        ...prev,
        jobId: prev.jobId,
        round: prev.round,
        type: prev.type,
        scheduledDate: prev.scheduledDate,
        ...updates,
      } as Interview
    })
  }

  const addCustomEvent = async () => {
    if (!newEvent.eventDate || !newEvent.title) return

    try {
      await createJobEvent({
        eventType: newEvent.eventType,
        eventDate: new Date(newEvent.eventDate),
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
      onUpdate()
    } catch (error) {
      console.error("Failed to add custom event:", error)
    }
  }

  const updateEvent = async (eventId: number, updates: Partial<JobEvent>) => {
    try {
      await fetch(`/api/job-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      onUpdate()
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
      onUpdate()
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const deleteInterviewWithEvents = async (interviewId: number) => {
    if (!confirm("Are you sure you want to delete this interview and all related events?")) return

    try {
      // Delete the interview
      await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      })

      // Delete related events
      const relatedEvents = jobEvents.filter(event => event.interviewId === interviewId)
      for (const event of relatedEvents) {
        await fetch(`/api/job-events/${event.id}`, {
          method: "DELETE",
        })
      }

      onUpdate()
    } catch (error) {
      console.error("Failed to delete interview:", error)
    }
  }

  const deleteInterview = async (interviewId: number) => {
    if (confirm("Are you sure you want to delete this interview and all related events?")) {
      try {
        // Delete related events first
        const relatedEvents = jobEvents.filter(event => event.interviewId === interviewId)
        for (const event of relatedEvents) {
          await fetch(`/api/job-events/${event.id}`, {
            method: "DELETE",
          })
        }

        // Then delete the interview
        await fetch(`/api/interviews/${interviewId}`, { method: "DELETE" })
        onUpdate()
      } catch (error) {
        console.error("Failed to delete interview:", error)
      }
    }
  }

  const saveEditingInterview = async () => {
    if (!editingInterview) return

    try {
      await fetch(`/api/interviews/${editingInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: editingInterview.round,
          type: editingInterview.type,
          scheduledDate: editingInterview.scheduledDate,
          interviewer: editingInterview.interviewer,
          result: editingInterview.result,
          feedback: editingInterview.feedback,
          notes: editingInterview.notes,
        }),
      })
      onUpdate()
      setEditingInterview(null)
    } catch (error) {
      console.error("Failed to update interview:", error)
    }
  }

  const getTypeConfig = (type: Interview["type"]) => {
    const configs = {
      phone: { label: "Phone Interview", color: "bg-blue-100 text-blue-800", icon: "📞" },
      video: { label: "Video Interview", color: "bg-green-100 text-green-800", icon: "📹" },
      onsite: { label: "Onsite Interview", color: "bg-purple-100 text-purple-800", icon: "🏢" },
      technical: { label: "Technical Interview", color: "bg-orange-100 text-orange-800", icon: "💻" },
      hr: { label: "HR Interview", color: "bg-pink-100 text-pink-800", icon: "👥" },
      final: { label: "Final Interview", color: "bg-indigo-100 text-indigo-800", icon: "🎯" },
    }
    return configs[type]
  }

  const getResultConfig = (result: Interview["result"]) => {
    const configs = {
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <AlertCircle className="w-4 h-4" />,
      },
      passed: {
        label: "Passed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      failed: {
        label: "Failed",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-4 h-4" />,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Pause className="w-4 h-4" />,
      },
    }
    return configs[result]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Management</h2>
              <div className="flex items-center text-lg text-gray-600">
                <span className="font-medium text-blue-600">{job.position}</span>
                <span className="mx-2">at</span>
                <span className="font-medium">{job.company}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Existing Interviews */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Interview Rounds</h3>
            {interviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No interviews scheduled yet</p>
                <p className="text-gray-500">Add your first interview below</p>
              </div>
            ) : (
              <div className="space-y-6">
                {interviews.map((interview) => {
                  const typeConfig = getTypeConfig(interview.interviewType || "technical")
                  const resultConfig = getResultConfig(interview.interviewResult || "pending")
                  const isEditing = editingInterview?.id === interview.id

                  return (
                    <div
                      key={interview.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-900">Edit Interview</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={saveEditingInterview}
                                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingInterview(null)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                              <input
                                type="number"
                                value={editingInterview?.round || 1}
                                onChange={(e) =>
                                  updateEditingInterview({ round: Number.parseInt(e.target.value) })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={editingInterview?.type || "technical"}
                                onChange={(e) =>
                                  updateEditingInterview({ type: e.target.value as Interview["type"] })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="technical">Technical Interview</option>
                                <option value="hr">HR Interview</option>
                                <option value="phone">Phone Interview</option>
                                <option value="video">Video Interview</option>
                                <option value="onsite">Onsite Interview</option>
                                <option value="final">Final Interview</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                              <input
                                type="datetime-local"
                                value={editingInterview?.scheduledDate ? new Date(editingInterview.scheduledDate).toISOString().slice(0, 16) : ""}
                                onChange={(e) =>
                                  updateEditingInterview({ scheduledDate: new Date(e.target.value) })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                              <input
                                type="text"
                                value={editingInterview?.interviewer || ""}
                                onChange={(e) =>
                                  updateEditingInterview({ interviewer: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Interviewer name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                              <select
                                value={editingInterview?.result || "pending"}
                                onChange={(e) =>
                                  updateEditingInterview({ result: e.target.value as Interview["result"] })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                            <textarea
                              value={editingInterview?.feedback || ""}
                              onChange={(e) =>
                                updateEditingInterview({ feedback: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              rows={3}
                              placeholder="Interview feedback and notes..."
                            />
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Interview Info */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900">Round {interview.interviewRound || 1}</h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                                {typeConfig.icon} {typeConfig.label}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(interview.eventDate).toLocaleString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {interview.interviewer && (
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-2" />
                                  {interview.interviewer}
                                </div>
                              )}
                              {interview.metadata?.duration && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  {interview.metadata.duration} minutes
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Result */}
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Result</label>
                            <select
                              value={interview.interviewResult || "pending"}
                              onChange={(e) =>
                                updateJobEvent(interview.id!, { interviewResult: e.target.value as JobEvent["interviewResult"] })
                              }
                              className={`w-full px-3 py-2 text-sm font-medium rounded-lg border ${resultConfig.color} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option value="pending">Pending</option>
                              <option value="passed">Passed</option>
                              <option value="failed">Failed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {/* Feedback */}
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              <MessageSquare className="w-4 h-4 inline mr-1" />
                              Feedback
                            </label>
                            <textarea
                              value={interview.notes || ""}
                              onChange={(e) => updateJobEvent(interview.id!, { notes: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                              placeholder="Interview feedback and notes..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!isEditing && (
                        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setEditingEvent(interview)}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm transition-colors duration-150"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteInterviewWithEvents(interview.id!)}
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm transition-colors duration-150"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add New Interview */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Schedule New Interview</h3>
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Round Number</label>
                  <input
                    type="number"
                    value={newInterview.round}
                    onChange={(e) => setNewInterview({ ...newInterview, round: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                  <select
                    value={newInterview.type}
                    onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value as Interview["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technical">Technical Interview</option>
                    <option value="hr">HR Interview</option>
                    <option value="phone">Phone Interview</option>
                    <option value="video">Video Interview</option>
                    <option value="onsite">Onsite Interview</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newInterview.scheduledDate}
                    onChange={(e) => setNewInterview({ ...newInterview, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer</label>
                  <input
                    type="text"
                    value={newInterview.interviewer}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Interviewer name"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Preparation notes, topics to discuss, etc..."
                />
              </div>

              <button
                onClick={addInterview}
                disabled={!newInterview.scheduledDate}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Schedule Interview
              </button>
            </div>
          </div>

          {/* Events Timeline Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Timeline</h3>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </button>
            </div>

            {/* Custom Event Form */}
            {showEventForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">Add Custom Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={newEvent.eventType}
                      onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as JobEvent["eventType"] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="applied">Applied</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interview_completed">Interview Completed</option>
                      <option value="interview_result">Interview Result</option>
                      <option value="rejected">Rejected</option>
                      <option value="offer_received">Offer Received</option>
                      <option value="offer_accepted">Offer Accepted</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="ghosted">Ghosted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                    <input
                      type="date"
                      value={newEvent.eventDate}
                      onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Event title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Event description"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newEvent.notes}
                      onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomEvent}
                    disabled={!newEvent.eventDate || !newEvent.title}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            )}

            {/* Edit Event Form */}
            {editingEvent && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">Edit Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={editingEvent.eventType}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value as JobEvent["eventType"] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="applied">Applied</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interview_completed">Interview Completed</option>
                      <option value="interview_result">Interview Result</option>
                      <option value="rejected">Rejected</option>
                      <option value="offer_received">Offer Received</option>
                      <option value="offer_accepted">Offer Accepted</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="ghosted">Ghosted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                    <input
                      type="date"
                      value={new Date(editingEvent.eventDate).toISOString().slice(0, 10)}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventDate: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Event title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editingEvent.description || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Event description"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editingEvent.notes || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateEvent(editingEvent.id!, editingEvent)}
                    disabled={!editingEvent.eventDate || !editingEvent.title}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                  >
                    Update Event
                  </button>
                </div>
              </div>
            )}

            {/* Events List */}
            <div className="space-y-3">
              {jobEvents.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No events recorded yet</p>
              ) : (
                jobEvents
                  .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                  .map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-900">{event.title}</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(event.eventDate).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingEvent(event)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-150"
                                title="Edit event"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteEvent(event.id!)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
                                title="Delete event"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        {event.notes && (
                          <p className="text-xs text-gray-500 mt-1">{event.notes}</p>
                        )}
                        <div className="flex items-center mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.eventType === "applied" ? "bg-blue-100 text-blue-800" :
                            event.eventType === "interview_scheduled" ? "bg-yellow-100 text-yellow-800" :
                            event.eventType === "interview_completed" ? "bg-purple-100 text-purple-800" :
                            event.eventType === "interview_result" ? "bg-indigo-100 text-indigo-800" :
                            event.eventType === "rejected" ? "bg-red-100 text-red-800" :
                            event.eventType === "offer_received" ? "bg-green-100 text-green-800" :
                            event.eventType === "offer_accepted" ? "bg-emerald-100 text-emerald-800" :
                            event.eventType === "withdrawn" ? "bg-gray-100 text-gray-800" :
                            event.eventType === "ghosted" ? "bg-slate-100 text-slate-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {event.eventType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {event.interviewRound && (
                            <span className="ml-2 text-xs text-gray-500">
                              Round {event.interviewRound}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewModal

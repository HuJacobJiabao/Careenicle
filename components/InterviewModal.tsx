"use client"

import type React from "react"
import { useState } from "react"
import type { Job, Interview } from "@/lib/types"
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
} from "lucide-react"

interface InterviewModalProps {
  job: Job
  interviews: Interview[]
  onClose: () => void
  onUpdate: () => void
}

const InterviewModal: React.FC<InterviewModalProps> = ({ job, interviews, onClose, onUpdate }) => {
  const [newInterview, setNewInterview] = useState({
    round: interviews.length + 1,
    type: "technical" as Interview["type"],
    scheduledDate: "",
    interviewer: "",
    notes: "",
  })
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)

  const addInterview = async () => {
    if (!newInterview.scheduledDate) return

    try {
      await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newInterview,
          jobId: job.id,
          result: "pending",
        }),
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

  const updateInterview = async (interviewId: number, updates: Partial<Interview>) => {
    try {
      await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to update interview:", error)
    }
  }

  const deleteInterview = async (interviewId: number) => {
    if (confirm("Are you sure you want to delete this interview?")) {
      try {
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
                  const typeConfig = getTypeConfig(interview.type)
                  const resultConfig = getResultConfig(interview.result)
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
                                value={editingInterview.round}
                                onChange={(e) =>
                                  setEditingInterview({
                                    ...editingInterview,
                                    round: Number.parseInt(e.target.value),
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={editingInterview.type}
                                onChange={(e) =>
                                  setEditingInterview({
                                    ...editingInterview,
                                    type: e.target.value as Interview["type"],
                                  })
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
                                value={new Date(editingInterview.scheduledDate).toISOString().slice(0, 16)}
                                onChange={(e) =>
                                  setEditingInterview({
                                    ...editingInterview,
                                    scheduledDate: new Date(e.target.value),
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                              <input
                                type="text"
                                value={editingInterview.interviewer || ""}
                                onChange={(e) =>
                                  setEditingInterview({
                                    ...editingInterview,
                                    interviewer: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Interviewer name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                              <select
                                value={editingInterview.result}
                                onChange={(e) =>
                                  setEditingInterview({
                                    ...editingInterview,
                                    result: e.target.value as Interview["result"],
                                  })
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
                              value={editingInterview.feedback || ""}
                              onChange={(e) =>
                                setEditingInterview({
                                  ...editingInterview,
                                  feedback: e.target.value,
                                })
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
                              <h4 className="text-lg font-semibold text-gray-900">Round {interview.round}</h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                                {typeConfig.icon} {typeConfig.label}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(interview.scheduledDate).toLocaleString("en-US", {
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
                              {interview.duration && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  {interview.duration} minutes
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Result */}
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Result</label>
                            <select
                              value={interview.result}
                              onChange={(e) =>
                                updateInterview(interview.id!, { result: e.target.value as Interview["result"] })
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
                              value={interview.feedback || ""}
                              onChange={(e) => updateInterview(interview.id!, { feedback: e.target.value })}
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
                            onClick={() => setEditingInterview(interview)}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm transition-colors duration-150"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteInterview(interview.id!)}
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
        </div>
      </div>
    </div>
  )
}

export default InterviewModal

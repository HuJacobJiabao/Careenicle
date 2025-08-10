"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview } from "@/lib/types"
import InterviewModal from "./InterviewModal"
import AddJobModal from "./AddJobModal"
import EditJobModal from "./EditJobModal"
import {
  Building2,
  Calendar,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  Settings,
  Filter,
  MapPin,
  Clock,
  Edit,
} from "lucide-react"

const JobTable: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showAddJobModal, setShowAddJobModal] = useState(false)
  const [showEditJobModal, setShowEditJobModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    fetchJobs()
    fetchInterviews()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs")
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/interviews")
      const data = await response.json()
      setInterviews(data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const updateJobStatus = async (jobId: number, status: Job["status"]) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchJobs()
    } catch (error) {
      console.error("Failed to update job status:", error)
    }
  }

  const deleteJob = async (jobId: number) => {
    if (confirm("Are you sure you want to delete this job application?")) {
      try {
        await fetch(`/api/jobs/${jobId}`, { method: "DELETE" })
        fetchJobs()
        fetchInterviews()
      } catch (error) {
        console.error("Failed to delete job:", error)
      }
    }
  }

  const getJobInterviews = (jobId: number) => {
    return interviews.filter((interview) => interview.jobId === jobId)
  }

  const getUpcomingInterview = (jobId: number) => {
    const jobInterviews = getJobInterviews(jobId)
    const now = new Date()
    return jobInterviews
      .filter((interview) => new Date(interview.scheduledDate) > now && interview.result === "pending")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }

  const getUpcomingInterviewJobs = () => {
    const now = new Date()
    const upcomingJobs = jobs
      .map((job) => ({
        ...job,
        upcomingInterview: getUpcomingInterview(job.id!),
      }))
      .filter((job) => job.upcomingInterview)
      .sort(
        (a, b) =>
          new Date(a.upcomingInterview!.scheduledDate).getTime() -
          new Date(b.upcomingInterview!.scheduledDate).getTime(),
      )

    return upcomingJobs
  }

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "all") return true
    return job.status === statusFilter
  })

  const getStatusConfig = (status: Job["status"]) => {
    const configs = {
      applied: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        label: "Applied",
        icon: "📝",
      },
      interview: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Interview",
        icon: "🎯",
      },
      rejected: {
        color: "bg-red-50 text-red-700 border-red-200",
        label: "Rejected",
        icon: "❌",
      },
      offer: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Offer",
        icon: "🎉",
      },
      accepted: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Accepted",
        icon: "✅",
      },
    }
    return configs[status]
  }

  const getInterviewSummary = (interviews: Interview[]) => {
    if (interviews.length === 0) return { text: "No interviews", color: "text-gray-500" }

    const pending = interviews.filter((i) => i.result === "pending").length
    const passed = interviews.filter((i) => i.result === "passed").length
    const failed = interviews.filter((i) => i.result === "failed").length

    if (pending > 0) return { text: `${pending} pending`, color: "text-amber-600" }
    if (failed > 0) return { text: `${failed}/${interviews.length} failed`, color: "text-red-600" }
    if (passed === interviews.length) return { text: `${passed}/${interviews.length} passed`, color: "text-green-600" }
    return { text: `${passed}/${interviews.length} passed`, color: "text-blue-600" }
  }

  const upcomingInterviewJobs = getUpcomingInterviewJobs()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
            <p className="mt-2 text-gray-600">Track your job applications and interview progress</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="offer">Offer</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddJobModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Job
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews Section */}
      {upcomingInterviewJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" />
            Upcoming Interviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingInterviewJobs.map((job) => (
              <div
                key={job.id}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.company}</h3>
                    <p className="text-sm text-gray-600">{job.position}</p>
                    {job.location && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.location}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    Round {job.upcomingInterview!.round}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {new Date(job.upcomingInterview!.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    <p className="text-gray-600">
                      {new Date(job.upcomingInterview!.scheduledDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedJob(job)
                      setShowInterviewModal(true)
                    }}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Applications", value: jobs.length, color: "bg-blue-500", icon: "📊" },
          {
            label: "Active Interviews",
            value: jobs.filter((j) => j.status === "interview").length,
            color: "bg-amber-500",
            icon: "🎯",
          },
          {
            label: "Offers Received",
            value: jobs.filter((j) => j.status === "offer").length,
            color: "bg-green-500",
            icon: "🎉",
          },
          {
            label: "Success Rate",
            value: `${Math.round((jobs.filter((j) => j.status === "offer" || j.status === "accepted").length / Math.max(jobs.length, 1)) * 100)}%`,
            color: "bg-purple-500",
            icon: "📈",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 text-white text-xl`}>{stat.icon}</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company & Position
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => {
                const jobInterviews = getJobInterviews(job.id!)
                const statusConfig = getStatusConfig(job.status)
                const interviewSummary = getInterviewSummary(jobInterviews)
                const upcomingInterview = getUpcomingInterview(job.id!)

                return (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 transition-colors duration-150 relative"
                    onMouseEnter={() => setHoveredRow(job.id!)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                            >
                              {job.position}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">{job.company}</div>
                          {job.location && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tooltip for notes */}
                      {hoveredRow === job.id && job.notes && (
                        <div className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs left-6 top-full mt-2">
                          {job.notes}
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(job.applicationDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {jobInterviews.length > 0 ? `${jobInterviews.length} rounds` : "No interviews"}
                          </div>
                          <div className={`text-xs ${interviewSummary.color}`}>{interviewSummary.text}</div>
                          {upcomingInterview && (
                            <div className="text-xs text-amber-600 font-medium">
                              Next:{" "}
                              {new Date(upcomingInterview.scheduledDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id!, e.target.value as Job["status"])}
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${statusConfig.color} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                      >
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                        <option value="offer">Offer</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowEditJobModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-150"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowInterviewModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors duration-150"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Interviews
                        </button>
                        <button
                          onClick={() => deleteJob(job.id!)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === "all" ? "No job applications yet" : `No ${statusFilter} applications`}
            </h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === "all"
                ? "Start tracking your job search by adding your first application."
                : `No applications with ${statusFilter} status found.`}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={() => setShowAddJobModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Job
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showInterviewModal && selectedJob && (
        <InterviewModal
          job={selectedJob}
          interviews={getJobInterviews(selectedJob.id!)}
          onClose={() => {
            setShowInterviewModal(false)
            setSelectedJob(null)
          }}
          onUpdate={() => {
            fetchInterviews()
            fetchJobs()
          }}
        />
      )}

      {showAddJobModal && (
        <AddJobModal
          onClose={() => setShowAddJobModal(false)}
          onAdd={() => {
            fetchJobs()
            setShowAddJobModal(false)
          }}
        />
      )}

      {showEditJobModal && selectedJob && (
        <EditJobModal
          job={selectedJob}
          onClose={() => {
            setShowEditJobModal(false)
            setSelectedJob(null)
          }}
          onUpdate={() => {
            fetchJobs()
            setShowEditJobModal(false)
          }}
        />
      )}
    </div>
  )
}

export default JobTable

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview, UpcomingInterviewJob } from "@/lib/types"
import InterviewModal from "./InterviewModal"
import AddJobModal from "./AddJobModal"
import EditJobModal from "./EditJobModal"
import UpcomingInterviewsTable from "./UpcomingInterviewsTable"
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
  Edit,
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
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
  const [searchTerm, setSearchTerm] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchJobs()
    fetchInterviews()
  }, [pagination.page, statusFilter, searchTerm, showFavorites])

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
        favorites: showFavorites.toString(),
      })

      const response = await fetch(`/api/jobs?${params}`)
      const data = await response.json()
      setJobs(data.jobs)
      setPagination(data.pagination)
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

  const toggleFavorite = async (jobId: number, isFavorite: boolean) => {
    try {
      await fetch(`/api/jobs/${jobId}/favorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      })
      fetchJobs()
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
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

  const getUpcomingInterviewJobs = (): UpcomingInterviewJob[] => {
    const allJobs = [...jobs] // Include all jobs, not just current page
    const upcomingJobs = allJobs
      .map((job) => ({
        ...job,
        upcomingInterview: getUpcomingInterview(job.id!),
      }))
      .filter((job) => job.upcomingInterview) as UpcomingInterviewJob[]

    return upcomingJobs.sort(
      (a, b) =>
        new Date(a.upcomingInterview.scheduledDate).getTime() - new Date(b.upcomingInterview.scheduledDate).getTime(),
    )
  }

  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchJobs()
  }

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
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or position..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Filters */}
            <div className="flex space-x-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPagination({ ...pagination, page: 1 })
                  }}
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
                onClick={() => {
                  setShowFavorites(!showFavorites)
                  setPagination({ ...pagination, page: 1 })
                }}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFavorites
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${showFavorites ? "fill-current" : ""}`} />
                Favorites
              </button>

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
      </div>

      {/* Upcoming Interviews Table */}
      {upcomingInterviewJobs.length > 0 && (
        <UpcomingInterviewsTable
          jobs={upcomingInterviewJobs}
          onManageInterview={(job) => {
            setSelectedJob(job)
            setShowInterviewModal(true)
          }}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Applications", value: pagination.total, color: "bg-blue-500", icon: "📊" },
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
            label: "Favorites",
            value: jobs.filter((j) => j.isFavorite).length,
            color: "bg-red-500",
            icon: "❤️",
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
              {jobs.map((job) => {
                const jobInterviews = getJobInterviews(job.id!)
                const statusConfig = getStatusConfig(job.status)
                const interviewSummary = getInterviewSummary(jobInterviews)
                const upcomingInterview = getUpcomingInterview(job.id!)

                return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            src={getCompanyLogo(job.company) || "/placeholder.svg"}
                            alt={`${job.company} logo`}
                            className="w-10 h-10 rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=40&width=40&text=" + job.company.charAt(0)
                            }}
                          />
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
                            <button
                              onClick={() => toggleFavorite(job.id!, job.isFavorite!)}
                              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 ${job.isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                              />
                            </button>
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

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination({ ...pagination, page })}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pagination.page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === "all" && !searchTerm && !showFavorites
                ? "No job applications yet"
                : "No matching applications found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === "all" && !searchTerm && !showFavorites
                ? "Start tracking your job search by adding your first application."
                : "Try adjusting your search or filter criteria."}
            </p>
            {statusFilter === "all" && !searchTerm && !showFavorites && (
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

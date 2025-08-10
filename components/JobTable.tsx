"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview, UpcomingInterviewJob } from "@/lib/types"
import { DataService } from "@/lib/dataService"
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
  TrendingUp,
  Target,
  Award,
  Star,
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
      const data = await DataService.fetchJobs({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter,
        favorites: showFavorites,
      })
      setJobs(data.jobs)
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterviews = async () => {
    try {
      const data = await DataService.fetchInterviews()
      setInterviews(data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const updateJobStatus = async (jobId: number, status: Job["status"]) => {
    try {
      await DataService.updateJob(jobId, { status })
      fetchJobs()
    } catch (error) {
      console.error("Failed to update job status:", error)
    }
  }

  const toggleFavorite = async (jobId: number, isFavorite: boolean) => {
    try {
      await DataService.toggleFavorite(jobId, isFavorite)
      fetchJobs()
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const deleteJob = async (jobId: number) => {
    if (confirm("Are you sure you want to delete this job application?")) {
      try {
        await DataService.deleteJob(jobId)
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
    const allJobs = [...jobs]
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
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-in-up">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-6 sm:mb-0">
            <h1 className="text-4xl font-bold gradient-text mb-3">Job Applications Dashboard</h1>
            <p className="text-lg text-gray-600 font-medium">
              Track your job applications and interview progress with precision
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or position..."
                  className="form-input pl-12 pr-4 py-3 w-72 rounded-l-xl border-r-0"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-r-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Search
              </button>
            </form>

            {/* Filters */}
            <div className="flex space-x-3">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="form-input pl-12 pr-8 py-3 rounded-xl appearance-none bg-white cursor-pointer"
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
                className={`inline-flex items-center px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  showFavorites
                    ? "bg-red-100 text-red-700 hover:bg-red-200 shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Heart className={`w-5 h-5 mr-2 ${showFavorites ? "fill-current" : ""}`} />
                Favorites
              </button>

              <button onClick={() => setShowAddJobModal(true)} className="btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews Table */}
      {upcomingInterviewJobs.length > 0 && (
        <div className="mb-10 animate-slide-in-right">
          <UpcomingInterviewsTable
            jobs={upcomingInterviewJobs}
            onManageInterview={(job) => {
              setSelectedJob(job)
              setShowInterviewModal(true)
            }}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-scale-in">
        {[
          {
            label: "Total Applications",
            value: pagination.total,
            color: "from-blue-500 to-blue-600",
            icon: <TrendingUp className="w-6 h-6" />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
          },
          {
            label: "Active Interviews",
            value: jobs.filter((j) => j.status === "interview").length,
            color: "from-amber-500 to-orange-500",
            icon: <Target className="w-6 h-6" />,
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
          },
          {
            label: "Offers Received",
            value: jobs.filter((j) => j.status === "offer").length,
            color: "from-green-500 to-emerald-500",
            icon: <Award className="w-6 h-6" />,
            bgColor: "bg-green-50",
            textColor: "text-green-700",
          },
          {
            label: "Favorites",
            value: jobs.filter((j) => j.isFavorite).length,
            color: "from-red-500 to-pink-500",
            icon: <Star className="w-6 h-6" />,
            bgColor: "bg-red-50",
            textColor: "text-red-700",
          },
        ].map((stat, index) => (
          <div key={index} className="card group hover:scale-105">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                </div>
                <div
                  className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-200`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="card animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Company & Position
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Interview Status
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {jobs.map((job, index) => {
                const jobInterviews = getJobInterviews(job.id!)
                const statusConfig = getStatusConfig(job.status)
                const interviewSummary = getInterviewSummary(jobInterviews)
                const upcomingInterview = getUpcomingInterview(job.id!)

                return (
                  <tr
                    key={job.id}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            src={getCompanyLogo(job.company) || "/placeholder.svg"}
                            alt={`${job.company} logo`}
                            className="w-12 h-12 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=48&width=48&text=" + job.company.charAt(0)
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center group-hover:text-blue-700 transition-colors duration-200"
                            >
                              {job.position}
                              <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </a>
                            <button
                              onClick={() => toggleFavorite(job.id!, job.isFavorite!)}
                              className="ml-3 p-1 hover:bg-red-50 rounded-full transition-colors duration-200"
                            >
                              <Heart
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  job.isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
                                }`}
                              />
                            </button>
                          </div>
                          <div className="text-base font-bold text-gray-900 mt-1">{job.company}</div>
                          {job.location && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                        {new Date(job.applicationDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {jobInterviews.length > 0 ? `${jobInterviews.length} rounds` : "No interviews"}
                          </div>
                          <div className={`text-xs font-medium ${interviewSummary.color}`}>{interviewSummary.text}</div>
                          {upcomingInterview && (
                            <div className="text-xs text-amber-600 font-semibold">
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
                    <td className="px-6 py-5 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id!, e.target.value as Job["status"])}
                        className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${statusConfig.color} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all duration-200 hover:shadow-md`}
                      >
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                        <option value="offer">Offer</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowEditJobModal(true)
                          }}
                          className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 font-semibold hover:shadow-md"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowInterviewModal(true)
                          }}
                          className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-all duration-200 font-semibold hover:shadow-md"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Interviews
                        </button>
                        <button
                          onClick={() => deleteJob(job.id!)}
                          className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 font-semibold hover:shadow-md"
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
        <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Showing <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                <span className="font-bold">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination({ ...pagination, page })}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-semibold transition-colors duration-200 ${
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
                  className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {statusFilter === "all" && !searchTerm && !showFavorites
                ? "No job applications yet"
                : "No matching applications found"}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              {statusFilter === "all" && !searchTerm && !showFavorites
                ? "Start tracking your job search by adding your first application."
                : "Try adjusting your search or filter criteria."}
            </p>
            {statusFilter === "all" && !searchTerm && !showFavorites && (
              <button onClick={() => setShowAddJobModal(true)} className="btn-primary inline-flex items-center">
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

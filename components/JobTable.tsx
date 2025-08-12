"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, JobEvent, UpcomingInterviewJob } from "@/lib/types"
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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Award,
  Star,
} from "lucide-react"

const JobTable: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobEvents, setJobEvents] = useState<JobEvent[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showAddJobModal, setShowAddJobModal] = useState(false)
  const [showEditJobModal, setShowEditJobModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "connected" | "no-tables" | "failed">("checking")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Check database connectivity and decide between PostgreSQL or mock data
  useEffect(() => {
    const checkDataSource = async () => {
      // If user has manually set to use mock data, don't check database
      if (DataService.getUseMockData()) {
        setDatabaseStatus("connected") // Don't show error when using mock data intentionally
        return
      }

      try {
        // Try to fetch a small amount of data to test database connection
        const response = await fetch("/api/jobs?limit=1")
        if (response.ok) {
          const data = await response.json()
          if (data.jobs !== undefined) {
            // Database is working and has tables
            DataService.setUseMockData(false)
            setDatabaseStatus("connected")
            console.log("Using PostgreSQL database")
          } else {
            // Database connected but no tables or unexpected response
            setDatabaseStatus("no-tables")
            DataService.setUseMockData(true)
          }
        } else if (response.status === 500) {
          // Check if it's a table not found error
          const errorText = await response.text()
          if (errorText.includes("does not exist") || errorText.includes("relation") || errorText.includes("table")) {
            setDatabaseStatus("no-tables")
            DataService.setUseMockData(true)
          } else {
            throw new Error("Database connection failed")
          }
        } else {
          throw new Error("Database connection failed")
        }
      } catch (error) {
        // Database failed, use mock data
        console.warn("Database connection failed, using mock data:", error)
        setDatabaseStatus("failed")
        DataService.setUseMockData(true)
      }
    }

    checkDataSource()
  }, [])

  useEffect(() => {
    fetchJobs()
    fetchJobEvents()
  }, [pagination.page, statusFilter, searchTerm, showFavorites, DataService.getUseMockData()])

  // Update database status when user manually switches data source
  useEffect(() => {
    const handleDataSourceChange = () => {
      if (DataService.getUseMockData()) {
        // User switched to mock data manually, don't show database errors
        setDatabaseStatus("connected")
      } else {
        // User switched back to database, re-check connection
        setDatabaseStatus("checking")
        const recheckDatabase = async () => {
          try {
            const response = await fetch("/api/jobs?limit=1")
            if (response.ok) {
              const data = await response.json()
              if (data.jobs !== undefined) {
                setDatabaseStatus("connected")
              } else {
                setDatabaseStatus("no-tables")
              }
            } else {
              setDatabaseStatus("failed")
            }
          } catch (error) {
            setDatabaseStatus("failed")
          }
        }
        recheckDatabase()
      }
    }

    // Listen for data source changes
    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [])

  const fetchJobs = async () => {
    try {
      const data = await DataService.fetchJobs({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter,
        favorites: showFavorites,
      })

      // Ensure jobs is always an array
      if (data && data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs)
      } else {
        console.warn("Invalid jobs data received:", data)
        setJobs([])
      }

      if (data && data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
      setJobs([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchJobEvents = async () => {
    try {
      // Fetch all job events
      const response = await fetch("/api/job-events")
      const data = await response.json()
      setJobEvents(data)
    } catch (error) {
      console.error("Failed to fetch job events:", error)
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
        fetchJobEvents()
      } catch (error) {
        console.error("Failed to delete job:", error)
      }
    }
  }

  const getJobInterviewEvents = (jobId: number) => {
    if (!jobEvents || !Array.isArray(jobEvents)) {
      return []
    }
    return jobEvents.filter((event) => event.jobId === jobId && event.eventType === "interview")
  }

  const getUpcomingInterview = (jobId: number) => {
    const interviewEvents = getJobInterviewEvents(jobId)
    const now = new Date()
    // Return the actual interview event (not the scheduled event) that is in the future
    return interviewEvents
      .filter((event) => new Date(event.eventDate) > now && event.eventType === "interview")
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0]
  }

  const getUpcomingInterviewJobs = (): UpcomingInterviewJob[] => {
    // Handle case when jobs is undefined or not iterable
    if (!jobs || !Array.isArray(jobs)) {
      return []
    }

    const allJobs = [...jobs]
    const upcomingJobs = allJobs
      .map((job) => ({
        ...job,
        upcomingInterview: getUpcomingInterview(job.id!),
      }))
      .filter((job) => job.upcomingInterview) as UpcomingInterviewJob[]

    return upcomingJobs.sort(
      (a, b) => new Date(a.upcomingInterview.eventDate).getTime() - new Date(b.upcomingInterview.eventDate).getTime(),
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

  const getInterviewSummary = (jobEvents: JobEvent[]) => {
    const interviewEvents = jobEvents.filter(
      (event) => event.eventType === "interview_scheduled" || event.eventType === "interview",
    )

    if (interviewEvents.length === 0) return { text: "No interviews", color: "text-gray-500" }

    const pending = interviewEvents.filter(
      (event) => event.eventType === "interview_scheduled" && new Date(event.eventDate) > new Date(),
    ).length
    const passed = interviewEvents.filter((event) => event.interviewResult === "passed").length
    const failed = interviewEvents.filter((event) => event.interviewResult === "failed").length

    if (pending > 0) return { text: `${pending} pending`, color: "text-amber-600" }
    if (failed > 0) return { text: `${failed}/${interviewEvents.length} failed`, color: "text-red-600" }
    if (passed === interviewEvents.length)
      return { text: `${passed}/${interviewEvents.length} passed`, color: "text-green-600" }
    return { text: `${passed}/${interviewEvents.length} passed`, color: "text-blue-600" }
  }

  const upcomingInterviewJobs = getUpcomingInterviewJobs()

  if (loading || databaseStatus === "checking") {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  // Show database initialization prompt if tables don't exist
  if (databaseStatus === "no-tables") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="bg-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Database Tables Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">
              It looks like the database tables haven't been initialized yet. Please run the initialization script to
              set up your job tracker.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">To initialize your database:</h2>
            <div className="text-left space-y-3">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div># Navigate to your project directory</div>
                <div>cd /path/to/job-tracker</div>
                <div className="mt-2"># Run the database initialization script</div>
                <div>psql -d your_database_name -f scripts/init-database-updated.sql</div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Replace <code className="bg-gray-200 px-2 py-1 rounded">your_database_name</code> with your actual
                database name.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Page After Setup
            </button>
            <div>
              <button
                onClick={() => {
                  DataService.setUseMockData(true)
                  setDatabaseStatus("connected")
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Use Demo Data Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show connection error if database failed completely and user is not intentionally using mock data
  if (databaseStatus === "failed" && !DataService.getUseMockData()) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Database Connection Failed</h1>
            <p className="text-lg text-gray-600 mb-8">Unable to connect to the database. Using demo data for now.</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-in-up">
      {/* Header */}
      <div className="mb-10">
        <div className="space-y-6">
          {/* Title Section */}
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-3">Job Applications Dashboard</h1>
            <p className="text-lg text-gray-600 font-medium">
              Track your job applications and interview progress with precision
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or position..."
                  className="form-input pl-14 pr-4 py-3 w-full rounded-l-xl border-r-0"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-r-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative min-w-[150px]">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="form-input pl-14 pr-10 py-3 rounded-xl appearance-none bg-white cursor-pointer w-full"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                  <option value="accepted">Accepted</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowFavorites(!showFavorites)
                  setPagination({ ...pagination, page: 1 })
                }}
                className={`inline-flex items-center px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap border-2 ${
                  showFavorites
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-lg border-yellow-300"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
                }`}
              >
                <Star
                  className={`w-5 h-5 mr-2 ${showFavorites ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                />
                Favorites
              </button>

              <button
                onClick={() => setShowAddJobModal(true)}
                className="btn-primary inline-flex items-center whitespace-nowrap"
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
        <div className="mb-10 animate-slide-in-right">
          <UpcomingInterviewsTable
            key={`upcoming-${jobEvents.length}-${jobs?.length || 0}`}
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
            value: jobs ? jobs.filter((j) => j.status === "interview").length : 0,
            color: "from-amber-500 to-orange-500",
            icon: <Target className="w-6 h-6" />,
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
          },
          {
            label: "Offers Received",
            value: jobs ? jobs.filter((j) => j.status === "offer").length : 0,
            color: "from-green-500 to-emerald-500",
            icon: <Award className="w-6 h-6" />,
            bgColor: "bg-green-50",
            textColor: "text-green-700",
          },
          {
            label: "Favorites",
            value: jobs ? jobs.filter((j) => j.isFavorite).length : 0,
            color: "from-yellow-500 to-amber-500",
            icon: <Star className="w-6 h-6" />,
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-700",
          },
        ].map((stat, index) => (
          <div key={index} className="card group hover:-translate-y-1">
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
                <th className="px-1 py-5 w-12">{/* Star column - no header text */}</th>
                <th className="px-2 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
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
              {jobs && jobs.length > 0 ? (
                jobs.map((job, index) => {
                  const jobInterviewEvents = getJobInterviewEvents(job.id!)
                  const statusConfig = getStatusConfig(job.status)
                  const interviewSummary = getInterviewSummary(jobInterviewEvents)
                  const upcomingInterview = getUpcomingInterview(job.id!)

                  return (
                    <tr
                      key={job.id}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-1 py-5 whitespace-nowrap w-12">
                        <div className="flex justify-center items-center h-full">
                          <button
                            onClick={() => toggleFavorite(job.id!, job.isFavorite!)}
                            className="p-1 hover:bg-yellow-50 rounded-full transition-colors duration-200"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors duration-200 ${
                                job.isFavorite
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300 hover:text-yellow-400"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-5">
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
                              {job.jobUrl ? (
                                <a
                                  href={job.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center group-hover:text-blue-700 transition-colors duration-200"
                                >
                                  {job.position}
                                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </a>
                              ) : (
                                <span className="text-base font-semibold text-gray-900">{job.position}</span>
                              )}
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
                              {jobInterviewEvents.length > 0 ? `${jobInterviewEvents.length} rounds` : "No interviews"}
                            </div>
                            <div className={`text-xs font-medium ${interviewSummary.color}`}>
                              {interviewSummary.text}
                            </div>
                            {upcomingInterview && (
                              <div className="text-xs text-amber-600 font-semibold">
                                Next:{" "}
                                {new Date(upcomingInterview.eventDate).toLocaleDateString("en-US", {
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
                            Manage
                          </button>
                          <button
                            onClick={() => deleteJob(job.id!)}
                            className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 font-semibold hover:shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">
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
                        <button
                          onClick={() => setShowAddJobModal(true)}
                          className="btn-primary inline-flex items-center"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add Your First Job
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
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

        {/* {(!jobs || jobs.length === 0) && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
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
        )} */}
      </div>

      {/* Modals */}
      {showInterviewModal && selectedJob && (
        <InterviewModal
          job={selectedJob}
          onClose={() => {
            setShowInterviewModal(false)
            setSelectedJob(null)
            // Refresh data when modal closes to ensure UI is up to date
            fetchJobEvents()
            fetchJobs()
          }}
          onUpdate={() => {
            fetchJobEvents()
            fetchJobs()
          }}
        />
      )}

      {showAddJobModal && (
        <AddJobModal
          onClose={() => setShowAddJobModal(false)}
          onAdd={() => {
            fetchJobs()
            fetchJobEvents()
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

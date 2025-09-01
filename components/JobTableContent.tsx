"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { Job, JobEvent, UpcomingInterviewJob } from "@/lib/types"
import { DataService } from "@/lib/dataService"
import { useJobs } from "@/lib/hooks/useJobs"
import { useJobEvents } from "@/lib/hooks/useJobEvents"
import { useStats } from "@/lib/hooks/useStats"
import { useQueryClient } from "@tanstack/react-query"
import InterviewModal from "./InterviewModal"
import AddJobModal from "./AddJobModal"
import EditJobModal from "./EditJobModal"
import UpcomingInterviewsTable from "./UpcomingInterviewsTable"
import ConfirmDialog from "./ConfirmDialog"
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

export default function JobTableContent() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState<Job["status"] | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [showFavorites, setShowFavorites] = useState(false)

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      // Reset to first page when search term changes
      if (searchTerm !== debouncedSearchTerm) {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    }, 200) // 200ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearchTerm])

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobs({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearchTerm,
    status: statusFilter,
    favorites: showFavorites,
  })

  const { data: jobEvents = [], isLoading: eventsLoading, refetch: refetchJobEvents } = useJobEvents()
  const { data: stats, isLoading: statsLoading } = useStats()
  const queryClient = useQueryClient()

  const jobs = jobsData?.jobs || []
  const isSearching = jobsLoading

  useEffect(() => {
    if (jobsData?.pagination) {
      setPagination(jobsData.pagination)
    }
  }, [jobsData?.pagination])

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showAddJobModal, setShowAddJobModal] = useState(false)
  const [showEditJobModal, setShowEditJobModal] = useState(false)
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

  // React Query will automatically refetch when data source changes
  useEffect(() => {
    const handleDataSourceChange = async () => {
      // Invalidate all queries to refetch with new data source
      refetchJobs()
      refetchJobEvents()
    }

    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [refetchJobs, refetchJobEvents])

  // Keep these functions for manual refresh when needed (e.g., after mutations)
  const fetchJobs = () => {
    refetchJobs()
  }

  const fetchJobEvents = () => {
    refetchJobEvents()
  }

  const updateJobStatus = async (jobId: number, status: Job["status"]) => {
    try {
      await DataService.updateJob(jobId, { status })
      refetchJobs()
      refetchJobEvents() // Refresh global job events 
      // Also refresh job-specific events cache for InterviewModal
      queryClient.invalidateQueries({ queryKey: ["job-events", jobId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    } catch (error) {
      console.error("Failed to update job status:", error)
    }
  }

  const toggleFavorite = async (jobId: number, isFavorite: boolean) => {
    try {
      await DataService.toggleFavorite(jobId, isFavorite)
      refetchJobs()
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const deleteJob = async (jobId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Job Application",
      message:
        "Are you sure you want to delete this job application? This will also delete all related events and cannot be undone.",
      onConfirm: async () => {
        try {
          await DataService.deleteJob(jobId)
          fetchJobs()
          fetchJobEvents()
          queryClient.invalidateQueries({ queryKey: ["stats"] })
        } catch (error) {
          console.error("Failed to delete job:", error)
        }
      },
    })
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

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    // Force immediate search by setting debounced term
    setDebouncedSearchTerm(searchTerm)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm])

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

  const formatLocalDate = (dateString: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return ""

    let date: Date
    if (typeof dateString === "string") {
      // Parse as local date to avoid timezone conversion
      const [year, month, day] = dateString.split("T")[0].split("-")
      date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    } else {
      date = dateString
    }

    return date.toLocaleDateString("en-US", options)
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10 animate-scale-in">
        {[
          {
            label: "Total Applications",
            value: stats?.totalApplications || 0,
            color: "from-blue-500 to-blue-600",
            icon: <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
          },
          {
            label: "Active Interviews",
            value: stats?.activeInterviews || 0,
            color: "from-amber-500 to-orange-500",
            icon: <Target className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
          },
          {
            label: "Offers Received",
            value: stats?.offersReceived || 0,
            color: "from-green-500 to-emerald-500",
            icon: <Award className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-green-50",
            textColor: "text-green-700",
          },
          {
            label: "Favorites",
            value: stats?.favorites || 0,
            color: "from-yellow-500 to-amber-500",
            icon: <Star className="w-4 h-4 md:w-6 md:h-6" />,
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-700",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-1 
                        p-3 md:p-6 
                        h-20 md:h-auto 
                        border border-gray-100"
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-0.5 md:mb-2 truncate">
                  {stat.label}
                </p>
                <p className="text-base md:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`p-1.5 md:p-4 rounded-md md:rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-sm md:shadow-lg group-hover:shadow-xl transition-all duration-200 flex-shrink-0 ml-2`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
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

      {/* Controls Section */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="space-y-4 md:space-y-0">
          {/* Mobile Layout: Search on separate row, then other controls */}
          <div className="md:hidden space-y-3">
            {/* Search Row */}
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or position..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-xl border-r-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-r-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Other Controls Row */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as Job["status"] | "all")
                  }}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-xl appearance-none bg-white cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                  <option value="accepted">Accepted</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`inline-flex items-center px-3 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap border-2 text-sm ${
                  showFavorites
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-lg border-yellow-300"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
                }`}
              >
                <Star className={`w-4 h-4 ${showFavorites ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`} />
              </button>

              <button
                onClick={() => setShowAddJobModal(true)}
                className="inline-flex items-center whitespace-nowrap px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex md:gap-4 md:items-center md:w-full">
            {/* Search - takes up remaining space */}
            <form onSubmit={handleSearch} className="flex flex-1">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or position..."
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-l-xl border-r-0 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-r-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl whitespace-nowrap text-base"
              >
                Search
              </button>
            </form>

            {/* Status Filter - fixed width */}
            <div className="relative min-w-[150px] flex-shrink-0">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as Job["status"] | "all")
                }}
                className="w-full pl-14 pr-10 py-3 border border-gray-300 rounded-xl appearance-none bg-white cursor-pointer text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Favorites Button - fixed width */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`inline-flex items-center px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap border-2 text-base flex-shrink-0 ${
                showFavorites
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-lg border-yellow-300"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
              }`}
            >
              <Star className={`w-5 h-5 mr-2 ${showFavorites ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`} />
              Favorites
            </button>

            {/* Add Job Button - fixed width */}
            <button
              onClick={() => setShowAddJobModal(true)}
              className="inline-flex items-center whitespace-nowrap px-5 py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Job
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card animate-fade-in relative">
        {/* Search loading overlay */}
        {isSearching && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="bg-white/80 backdrop-blur border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <span className="text-gray-700 font-medium">Searching...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
              {isSearching ? (
                // Show skeleton rows when loading
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-1 py-5 whitespace-nowrap w-12">
                      <div className="w-5 h-5 bg-gray-200 rounded mx-auto"></div>
                    </td>
                    <td className="px-2 py-5">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="ml-4 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : jobs && jobs.length > 0 ? (
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
                          {formatLocalDate(job.applicationDate, {
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
                                {formatLocalDate(upcomingInterview.eventDate, {
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
                        {statusFilter === "all" && !debouncedSearchTerm && !showFavorites
                          ? "No job applications yet"
                          : "No matching applications found"}
                      </h3>
                      <p className="text-gray-600 mb-6 text-lg">
                        {statusFilter === "all" && !debouncedSearchTerm && !showFavorites
                          ? "Start tracking your job search by adding your first application."
                          : "Try adjusting your search or filter criteria."}
                      </p>
                      {statusFilter === "all" && !debouncedSearchTerm && !showFavorites && (
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

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-4">
          {isSearching ? (
            // Show skeleton cards when loading
            Array.from({ length: 2 }).map((_, index) => (
              <div key={`skeleton-mobile-${index}`} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-14"></div>
                  </div>
                </div>
              </div>
            ))
          ) : jobs && jobs.length > 0 ? (
            jobs.map((job, index) => {
              const jobInterviewEvents = getJobInterviewEvents(job.id!)
              const statusConfig = getStatusConfig(job.status)
              const interviewSummary = getInterviewSummary(jobInterviewEvents)

              return (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getCompanyLogo(job.company) || "/placeholder.svg"}
                        alt={`${job.company} logo`}
                        className="w-10 h-10 rounded-lg shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{job.company}</h3>
                        {job.jobUrl ? (
                          <a
                            href={job.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
                          >
                            {job.position}
                          </a>
                        ) : (
                          <p className="text-gray-600 text-sm">{job.position}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(job.id!, job.isFavorite!)}
                      className="p-1 hover:bg-yellow-50 rounded-full transition-colors duration-200"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors duration-200 ${
                          job.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3">
                    {/* Status and Date */}
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <select
                          value={job.status}
                          onChange={(e) => updateJobStatus(job.id!, e.target.value as Job["status"])}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none pr-6 ${statusConfig.color}`}
                        >
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="offer">Offer</option>
                          <option value="accepted">Accepted</option>
                        </select>
                        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-3 h-3 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{formatLocalDate(job.applicationDate)}</span>
                    </div>

                    {/* Interview Status */}
                    <div className="text-sm">
                      <span className={`font-medium ${interviewSummary.color}`}>{interviewSummary.text}</span>
                    </div>

                    {/* Location */}
                    {job.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowInterviewModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors duration-150"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Manage
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJob(job)
                            setShowEditJobModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => deleteJob(job.id!)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No job applications found</h3>
              <p className="text-gray-600 mb-6">
                {statusFilter !== "all" || debouncedSearchTerm || showFavorites
                  ? "Try adjusting your filters or search terms."
                  : "Start tracking your job applications by adding your first job."}
              </p>
              {statusFilter === "all" && !debouncedSearchTerm && !showFavorites && (
                <button onClick={() => setShowAddJobModal(true)} className="btn-primary inline-flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Job
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-gray-50/50 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between lg:hidden">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="flex items-center text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="hidden lg:flex-1 lg:flex lg:items-center lg:justify-between">
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
            queryClient.invalidateQueries({ queryKey: ["stats"] })
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
            queryClient.invalidateQueries({ queryKey: ["stats"] })
            setShowEditJobModal(false)
          }}
        />
      )}

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
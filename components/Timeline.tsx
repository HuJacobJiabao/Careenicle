"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview, TimelineEvent } from "@/lib/types"
import { FileText, Users, Calendar, Clock, ExternalLink, MapPin, Briefcase, Star } from "lucide-react"
import { DataService } from "@/lib/dataService"

const Timeline: React.FC = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [DataService.getUseMockData()])

  const fetchTimelineData = async () => {
    try {
      // DataService.fetchJobs already returns { jobs: Job[], pagination?: any }
      const jobsData = await DataService.fetchJobs({ limit: 1000 })
      // DataService.fetchInterviews already returns Interview[]
      const interviews: Interview[] = await DataService.fetchInterviews()

      const jobs: Job[] = jobsData.jobs || [] // Ensure jobs is an array

      const events: TimelineEvent[] = []

      // Add application events
      jobs.forEach((job) => {
        events.push({
          id: `job-${job.id}`,
          type: "application",
          company: job.company,
          position: job.position,
          date: new Date(job.applicationDate),
          title: `Applied to ${job.company}`,
          description: job.position,
          status: job.status,
          location: job.location,
        })
      })

      // Add interview events
      interviews.forEach((interview) => {
        const job = jobs.find((j) => j.id === interview.jobId)
        if (job) {
          events.push({
            id: `interview-${interview.id}`,
            type: "interview",
            company: job.company,
            position: job.position,
            date: new Date(interview.scheduledDate),
            title: `Round ${interview.round} Interview - ${job.company}`,
            description: `${getTypeLabel(interview.type)} ${interview.interviewer ? `with ${interview.interviewer}` : ""}`,
            status: interview.result,
            location: job.location,
          })
        }
      })

      // Sort by date (newest first)
      events.sort((a, b) => b.date.getTime() - b.date.getTime()) // Fixed sorting to be consistent
      setTimelineEvents(events)
    } catch (error) {
      console.error("Failed to fetch timeline data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: Interview["type"]) => {
    const labels = {
      phone: "Phone Interview",
      video: "Video Interview",
      onsite: "Onsite Interview",
      technical: "Technical Interview",
      hr: "HR Interview",
      final: "Final Interview",
    }
    return labels[type]
  }

  const getEventConfig = (event: TimelineEvent) => {
    if (event.type === "application") {
      const statusConfigs = {
        applied: {
          color: "bg-gradient-to-r from-blue-500 to-blue-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
          textColor: "text-blue-800",
          borderColor: "border-blue-300",
          shadowColor: "shadow-blue-200",
        },
        interview: {
          color: "bg-gradient-to-r from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-100",
          textColor: "text-amber-800",
          borderColor: "border-amber-300",
          shadowColor: "shadow-amber-200",
        },
        rejected: {
          color: "bg-gradient-to-r from-red-500 to-red-600",
          bgColor: "bg-gradient-to-br from-red-50 to-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-300",
          shadowColor: "shadow-red-200",
        },
        offer: {
          color: "bg-gradient-to-r from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
          textColor: "text-green-800",
          borderColor: "border-green-300",
          shadowColor: "shadow-green-200",
        },
        accepted: {
          color: "bg-gradient-to-r from-purple-500 to-violet-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-100",
          textColor: "text-purple-800",
          borderColor: "border-purple-300",
          shadowColor: "shadow-purple-200",
        },
      }
      return statusConfigs[event.status as Job["status"]] || statusConfigs.applied
    } else {
      const resultConfigs = {
        pending: {
          color: "bg-gradient-to-r from-yellow-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-yellow-50 to-amber-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-300",
          shadowColor: "shadow-yellow-200",
        },
        passed: {
          color: "bg-gradient-to-r from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
          textColor: "text-green-800",
          borderColor: "border-green-300",
          shadowColor: "shadow-green-200",
        },
        failed: {
          color: "bg-gradient-to-r from-red-500 to-red-600",
          bgColor: "bg-gradient-to-br from-red-50 to-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-300",
          shadowColor: "shadow-red-200",
        },
        cancelled: {
          color: "bg-gradient-to-r from-gray-500 to-gray-600",
          bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-300",
          shadowColor: "shadow-gray-200",
        },
      }
      return resultConfigs[event.status as Interview["result"]] || resultConfigs.pending
    }
  }

  const getEventIcon = (event: TimelineEvent) => {
    if (event.type === "application") {
      return <FileText className="w-5 h-5 text-white" />
    } else {
      return <Users className="w-5 h-5 text-white" />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusLabel = (status: Job["status"]) => {
    const labels = {
      applied: "Applied",
      interview: "Interview",
      rejected: "Rejected",
      offer: "Offer Received",
      accepted: "Accepted",
    }
    return labels[status]
  }

  const getResultLabel = (result: Interview["result"]) => {
    const labels = {
      pending: "Pending",
      passed: "Passed",
      failed: "Failed",
      cancelled: "Cancelled",
    }
    return labels[result]
  }

  const getStatusEmoji = (status: string, type: string) => {
    if (type === "application") {
      const emojis = {
        applied: "📝",
        interview: "🎯",
        rejected: "❌",
        offer: "🎉",
        accepted: "✅",
      }
      return emojis[status as Job["status"]] || "📝"
    } else {
      const emojis = {
        pending: "⏳",
        passed: "✅",
        failed: "❌",
        cancelled: "⏸️",
      }
      return emojis[status as Interview["result"]] || "⏳"
    }
  }

  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Job Search Timeline
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your job search journey and interview progress with a beautiful visual timeline
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line with gradient */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>

        <div className="space-y-8">
          {timelineEvents.map((event, index) => {
            const config = getEventConfig(event)
            const isFirst = index === 0
            const isUpcoming = new Date(event.date) > new Date()

            return (
              <div key={event.id} className="relative flex items-start">
                {/* Timeline node with enhanced styling */}
                <div
                  className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${config.color} shadow-xl ${config.shadowColor} ${
                    isFirst ? "ring-4 ring-blue-200 ring-opacity-50" : ""
                  } ${isUpcoming ? "animate-pulse" : ""}`}
                >
                  {getEventIcon(event)}
                  {isFirst && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-yellow-800" />
                    </div>
                  )}
                </div>

                {/* Event content with narrower design */}
                <div className="flex-1 ml-6 min-w-0">
                  <div
                    className={`${config.bgColor} rounded-2xl shadow-lg border-2 ${config.borderColor} p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 max-w-md`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <img
                            src={getCompanyLogo(event.company) || "/placeholder.svg"}
                            alt={`${event.company} logo`}
                            className="w-6 h-6 rounded mr-2 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=24&width=24&text=" + event.company.charAt(0)
                            }}
                          />
                          <span className="text-lg mr-2">{getStatusEmoji(event.status, event.type)}</span>
                          <h3 className="text-lg font-bold text-gray-900 truncate">{event.company}</h3>
                        </div>

                        <div className="flex items-center text-gray-700 mb-2">
                          <Briefcase className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{event.position}</span>
                        </div>

                        {event.location && (
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="text-sm">{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center bg-white bg-opacity-50 rounded-full px-2 py-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span className="font-medium">{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center bg-white bg-opacity-50 rounded-full px-2 py-1">
                            <Clock className="w-3 h-3 mr-1" />
                            <span className="font-medium">{formatTime(event.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-3 flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${config.textColor} bg-white bg-opacity-80 border ${config.borderColor} shadow-sm`}
                        >
                          {event.type === "application"
                            ? getStatusLabel(event.status as Job["status"])
                            : getResultLabel(event.status as Interview["result"])}
                        </span>

                        {event.type === "application" && (
                          <a
                            href="#"
                            className="inline-flex items-center text-blue-700 hover:text-blue-900 text-xs font-medium bg-white bg-opacity-80 rounded-full px-2 py-1 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <ExternalLink className="w-2 h-2 mr-1" />
                            View
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator for first item */}
                    {isFirst && (
                      <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                        <div className="flex items-center text-xs font-medium text-blue-800">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse shadow-lg"></div>
                          Most recent
                        </div>
                      </div>
                    )}

                    {/* Upcoming indicator */}
                    {isUpcoming && (
                      <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                        <div className="flex items-center text-xs font-medium text-amber-800">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-bounce shadow-lg"></div>
                          Upcoming
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {timelineEvents.length === 0 && (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Calendar className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">No activities yet</h3>
              <p className="text-gray-600 text-xl mb-10 max-w-md mx-auto">
                Start your job search journey by adding your first application!
              </p>
              <a
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <FileText className="w-6 h-6 mr-3" />
                Add Your First Job
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Timeline

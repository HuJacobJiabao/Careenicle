"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, Interview, TimelineEvent } from "@/lib/types"
import { FileText, Users, Calendar, Clock, Building2, ExternalLink } from "lucide-react"

const Timeline: React.FC = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  const fetchTimelineData = async () => {
    try {
      const [jobsResponse, interviewsResponse] = await Promise.all([fetch("/api/jobs"), fetch("/api/interviews")])

      const jobs: Job[] = await jobsResponse.json()
      const interviews: Interview[] = await interviewsResponse.json()

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
          })
        }
      })

      // Sort by date (newest first)
      events.sort((a, b) => b.date.getTime() - a.date.getTime())
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
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        },
        interview: {
          color: "bg-amber-500",
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
        },
        rejected: {
          color: "bg-red-500",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        },
        offer: {
          color: "bg-green-500",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        },
        accepted: {
          color: "bg-purple-500",
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          borderColor: "border-purple-200",
        },
      }
      return statusConfigs[event.status as Job["status"]] || statusConfigs.applied
    } else {
      const resultConfigs = {
        pending: {
          color: "bg-yellow-500",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        },
        passed: {
          color: "bg-green-500",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        },
        failed: { color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200" },
        cancelled: {
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
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
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Search Timeline</h1>
        <p className="text-lg text-gray-600">Track your job search journey and interview progress</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>

        <div className="space-y-8">
          {timelineEvents.map((event, index) => {
            const config = getEventConfig(event)
            const isFirst = index === 0

            return (
              <div key={event.id} className="relative flex items-start">
                {/* Timeline node */}
                <div
                  className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${config.color} shadow-lg ${isFirst ? "ring-4 ring-blue-100" : ""}`}
                >
                  {getEventIcon(event)}
                </div>

                {/* Event content */}
                <div className="flex-1 ml-6 min-w-0">
                  <div
                    className={`bg-white rounded-2xl shadow-lg border-2 ${config.borderColor} p-6 hover:shadow-xl transition-shadow duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                        <div className="flex items-center text-gray-600 mb-3">
                          <Building2 className="w-4 h-4 mr-2" />
                          <span className="font-medium">{event.position}</span>
                        </div>
                        <p className="text-gray-700 mb-4">{event.description}</p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatTime(event.date)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
                        >
                          {event.type === "application"
                            ? getStatusLabel(event.status as Job["status"])
                            : getResultLabel(event.status as Interview["result"])}
                        </span>

                        {event.type === "application" && (
                          <a href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Job
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator for first item */}
                    {isFirst && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                          Most recent activity
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {timelineEvents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No activities yet</h3>
              <p className="text-gray-600 text-lg mb-8">
                Start your job search journey by adding your first application!
              </p>
              <a
                href="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
              >
                <FileText className="w-5 h-5 mr-2" />
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

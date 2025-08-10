"use client"

import type React from "react"
import type { UpcomingInterviewJob } from "@/lib/types"
import { Clock, Calendar, User, MapPin, ExternalLink, Settings } from "lucide-react"

interface UpcomingInterviewsTableProps {
  jobs: UpcomingInterviewJob[]
  onManageInterview: (job: UpcomingInterviewJob) => void
}

const UpcomingInterviewsTable: React.FC<UpcomingInterviewsTableProps> = ({ jobs, onManageInterview }) => {
  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  const getTypeConfig = (type: string) => {
    const configs = {
      phone: { label: "Phone Interview", color: "bg-blue-100 text-blue-800", icon: "📞" },
      video: { label: "Video Interview", color: "bg-green-100 text-green-800", icon: "📹" },
      onsite: { label: "Onsite Interview", color: "bg-purple-100 text-purple-800", icon: "🏢" },
      technical: { label: "Technical Interview", color: "bg-orange-100 text-orange-800", icon: "💻" },
      hr: { label: "HR Interview", color: "bg-pink-100 text-pink-800", icon: "👥" },
      final: { label: "Final Interview", color: "bg-indigo-100 text-indigo-800", icon: "🎯" },
    }
    return configs[type as keyof typeof configs] || configs.technical
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    )
  }

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-amber-500" />
        Upcoming Interviews ({jobs.length})
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company & Position
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interviewer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => {
                const interview = job.upcomingInterview
                const typeConfig = getTypeConfig(interview.type)
                const interviewDate = new Date(interview.scheduledDate)

                return (
                  <tr
                    key={`${job.id}-${interview.id}`}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      isToday(interviewDate) ? "bg-amber-50" : ""
                    }`}
                  >
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
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
                        >
                          {typeConfig.icon} Round {interview.round} - {typeConfig.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className={`font-medium ${isToday(interviewDate) ? "text-amber-600" : "text-gray-900"}`}>
                            {formatDateLabel(interviewDate)}
                          </div>
                          <div className="text-gray-600">
                            {interviewDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interview.interviewer ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {interview.interviewer}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onManageInterview(job)}
                        className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors duration-150"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UpcomingInterviewsTable

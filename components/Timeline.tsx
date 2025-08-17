"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, JobEvent } from "@/lib/types"
import { MapPin, Briefcase, CheckCircle, XCircle, Trophy, Send, MessageSquare, Building } from "lucide-react"
import { DataService } from "@/lib/dataService"

interface TimelineEventDisplay {
  id: string
  type: string
  company: string
  position: string
  date: Date
  eventType: JobEvent["eventType"]
  location?: string
  priority: number
  side: "left" | "right"
  // 面试相关字段
  interviewType?: string
  interviewRound?: number
}

const Timeline: React.FC = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  // Listen for data source changes
  useEffect(() => {
    const handleDataSourceChange = () => {
      fetchTimelineData()
    }

    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [])

  const fetchTimelineData = async () => {
    try {
      const jobsData = await DataService.fetchJobs({ limit: 1000 })
      const jobs: Job[] = jobsData.jobs || []

      const events: TimelineEventDisplay[] = []

      for (const job of jobs) {
        if (!job.id) continue // 跳过没有ID的工作
        const jobEvents = await DataService.fetchJobEvents(job.id)

        jobEvents.forEach((event: JobEvent) => {
          // 只包含指定的5种事件类型
          const allowedEvents: JobEvent["eventType"][] = [
            "applied",
            "interview",
            "rejected",
            "offer_received",
            "offer_accepted",
          ]

          if (!allowedEvents.includes(event.eventType)) return

          const priority = getEventPriority(event.eventType)
          const side = getEventSide(event.eventType)

          events.push({
            id: `event-${event.id}`,
            type: event.eventType,
            company: job.company,
            position: job.position,
            date: new Date(event.eventDate),
            eventType: event.eventType,
            location: job.location,
            priority,
            side,
            interviewType: event.interviewType,
            interviewRound: event.interviewRound,
          })
        })
      }

      // 按日期排序 (最新的在前)
      events.sort((a, b) => b.date.getTime() - a.date.getTime())
      setTimelineEvents(events)
    } catch (error) {
      console.error("Failed to fetch timeline data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventPriority = (eventType: JobEvent["eventType"]): number => {
    const priorities: Record<string, number> = {
      offer_accepted: 10,
      offer_received: 9,
      rejected: 8,
      interview: 7,
      applied: 6,
    }
    return priorities[eventType] || 1
  }

  // 决定事件显示在时间轴的哪一侧
  const getEventSide = (eventType: JobEvent["eventType"]): "left" | "right" => {
    // rejected, offer_received, offer_accepted 在左边；applied, interview 在右边
    const leftSideEvents = ["rejected", "offer_received", "offer_accepted"]
    return leftSideEvents.includes(eventType) ? "left" : "right"
  }

  const getEventConfig = (eventType: JobEvent["eventType"]) => {
    const configs: Record<
      string,
      { icon: React.ElementType; color: string; bgColor: string; textColor: string; borderColor: string }
    > = {
      applied: {
        icon: Send,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
      },
      interview: {
        icon: MessageSquare,
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-800",
        borderColor: "border-purple-200",
      },
      rejected: {
        icon: XCircle,
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        borderColor: "border-red-200",
      },
      offer_received: {
        icon: Trophy,
        color: "bg-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        borderColor: "border-green-200",
      },
      offer_accepted: {
        icon: CheckCircle,
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-800",
        borderColor: "border-emerald-200",
      },
    }
    return configs[eventType] || configs.applied
  }

  const getEventDisplayName = (eventType: JobEvent["eventType"], event?: TimelineEventDisplay): string => {
    if (eventType === "interview" && event) {
      const interviewTypeDisplay = getInterviewTypeDisplay(event.interviewType)
      const round = event.interviewRound ? ` Round ${event.interviewRound}` : ""
      return `${interviewTypeDisplay}${round}`
    }

    const names: Record<string, string> = {
      applied: "Applied",
      interview: "Interview",
      rejected: "Rejected",
      offer_received: "Offer Received",
      offer_accepted: "Offer Accepted",
    }
    return names[eventType] || eventType
  }

  const getInterviewTypeDisplay = (interviewType?: string): string => {
    const typeMap: Record<string, string> = {
      phone: "Phone Interview",
      video: "Video Interview",
      onsite: "Onsite Interview",
      technical: "Technical Interview",
      hr: "HR Interview",
      final: "Final Interview",
      oa: "Online Assessment",
      vo: "Virtual Onsite",
    }
    return typeMap[interviewType || "technical"] || "Interview"
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  const isFirstEventInMonth = (event: TimelineEventDisplay, index: number) => {
    if (index === 0) return true
    const currentMonth = event.date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
    const previousMonth = timelineEvents[index - 1].date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
    return currentMonth !== previousMonth
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-4">Job Application Timeline</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Track your career journey and application progress through interactive timeline
            </p>
          </div>
          <div className="animate-pulse">
            <div className="space-y-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-1/2 p-4">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full mx-4"></div>
                  <div className="w-1/2 p-4">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-4">Job Application Timeline</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Track your career journey and application progress through interactive timeline
            </p>
          </div>
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Timeline Events</h3>
            <p className="text-gray-500">
              Your job application events will appear here as you progress through the hiring process.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-4">Job Application Timeline</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Track your career journey and application progress through interactive timeline
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 md:transform md:-translate-x-0.5 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400 h-full rounded-full shadow-sm"></div>

          <div className="space-y-8 md:space-y-16">
            {timelineEvents.map((event, index) => {
              const config = getEventConfig(event.eventType)
              const IconComponent = config.icon
              const showMonthLabel = isFirstEventInMonth(event, index)
              const monthLabel = event.date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })

              return (
                <div key={event.id} className="relative">
                  {showMonthLabel && (
                    <div className="absolute left-0 md:left-1/2 md:transform md:-translate-x-1/2 -top-4 md:-top-8 z-20">
                      <div className="bg-white border-2 border-gray-200 rounded-full px-3 py-1 md:px-4 md:py-2 shadow-lg">
                        <span className="text-xs md:text-sm font-bold text-slate-700">{monthLabel}</span>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center group">
                    {/* Desktop Left side content */}
                    <div className="hidden md:block w-1/2 pr-12">
                      {event.side === "left" && (
                        <div
                          className={`${config.bgColor} ${config.borderColor} rounded-xl p-6 shadow-lg border-2 ml-auto max-w-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <div className="relative mb-3">
                                <img
                                  src={getCompanyLogo(event.company) || "/placeholder.svg"}
                                  alt={`${event.company} logo`}
                                  className="w-14 h-14 rounded-lg shadow-md border border-gray-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg?height=56&width=56&text=" + event.company.charAt(0)
                                  }}
                                />
                              </div>
                              <div className="text-left w-full">
                                <div className="text-sm font-semibold text-gray-900 mb-1 break-words">
                                  {event.company}
                                </div>
                                {event.location && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="break-words">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 items-end text-right flex-shrink-0">
                              <div
                                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white ${config.color} shadow-sm`}
                              >
                                <IconComponent className="w-3 h-3 mr-1" />
                                {getEventDisplayName(event.eventType, event)}
                              </div>
                              <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {formatDate(event.date)}
                              </div>
                              <div className="flex items-center text-sm font-semibold text-gray-900 mt-1">
                                <span className="text-right break-words">{event.position}</span>
                                <Briefcase className="w-4 h-4 ml-2 text-gray-400 flex-shrink-0" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="absolute left-8 md:left-1/2 md:transform md:-translate-x-1/2 z-10 flex flex-col items-center">
                      <div
                        className={`${config.color} rounded-full p-2 md:p-4 shadow-xl border-4 border-white group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                    </div>

                    <div className="w-full pl-20 md:w-1/2 md:pl-12">
                      {/* Mobile: show all events, Desktop: only right-side events */}
                      <div className="block md:hidden">
                        {/* Mobile: All events show on right side with optimized layout */}
                        <div
                          className={`${config.bgColor} ${config.borderColor} rounded-xl p-3 shadow-lg border-2 mr-auto max-w-full hover:shadow-xl transition-all duration-300`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={getCompanyLogo(event.company) || "/placeholder.svg"}
                              alt={`${event.company} logo`}
                              className="w-8 h-8 rounded-md shadow-sm border border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=32&width=32&text=" + event.company.charAt(0)
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold text-gray-900 truncate pr-2">{event.company}</div>
                                <div
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white ${config.color} shadow-sm flex-shrink-0`}
                                >
                                  <IconComponent className="w-2.5 h-2.5 mr-1" />
                                  <span className="text-xs">
                                    {getEventDisplayName(event.eventType, event).split(" ")[0]}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center text-xs text-gray-600 mb-1">
                                <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="break-words pr-2">{event.position}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                {event.location && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                                <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-auto">
                                  {formatDate(event.date)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Original right-side events */}
                      <div className="hidden md:block">
                        {event.side === "right" && (
                          <div
                            className={`${config.bgColor} ${config.borderColor} rounded-xl p-6 shadow-lg border-2 mr-auto max-w-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex flex-col gap-2 items-start text-left flex-shrink-0">
                                <div
                                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white ${config.color} shadow-sm`}
                                >
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {getEventDisplayName(event.eventType, event)}
                                </div>
                                <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {formatDate(event.date)}
                                </div>
                                <div className="flex items-center text-sm font-semibold text-gray-900 mt-1">
                                  <Briefcase className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="text-left break-words max-w-32">{event.position}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end min-w-0 flex-1">
                                <div className="relative mb-3">
                                  <img
                                    src={getCompanyLogo(event.company) || "/placeholder.svg"}
                                    alt={`${event.company} logo`}
                                    className="w-14 h-14 rounded-lg shadow-md border border-gray-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg?height=56&width=56&text=" + event.company.charAt(0)
                                    }}
                                  />
                                </div>
                                <div className="text-right w-full">
                                  <div className="text-sm font-semibold text-gray-900 mb-1 break-words">
                                    {event.company}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center justify-end text-xs text-gray-600">
                                      <span className="break-words">{event.location}</span>
                                      <MapPin className="w-3 h-3 ml-1 flex-shrink-0" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Timeline

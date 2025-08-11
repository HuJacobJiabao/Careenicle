"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Job, JobEvent } from "@/lib/types"
import { 
  Calendar, 
  MapPin, 
  Briefcase, 
  CheckCircle,
  XCircle,
  Trophy,
  Send,
  MessageSquare,
  Building,
  User
} from "lucide-react"
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
  side: 'left' | 'right'
  // 面试相关字段
  interviewType?: string
  interviewRound?: number
  interviewer?: string
}

const Timeline: React.FC = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [DataService.getUseMockData()])

  const fetchTimelineData = async () => {
    try {
      const jobsData = await DataService.fetchJobs({ limit: 1000 })
      const jobs: Job[] = jobsData.jobs || []
      
      const events: TimelineEventDisplay[] = []

      for (const job of jobs) {
        if (!job.id) continue; // 跳过没有ID的工作
        const jobEvents = await DataService.fetchJobEvents(job.id)
        
        jobEvents.forEach((event: JobEvent) => {
          // 只包含指定的5种事件类型
          const allowedEvents: JobEvent["eventType"][] = [
            'applied',
            'interview',
            'rejected',
            'offer_received',
            'offer_accepted'
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
            interviewer: event.interviewer
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
      'offer_accepted': 10,
      'offer_received': 9,
      'rejected': 8,
      'interview': 7,
      'applied': 6
    }
    return priorities[eventType] || 1
  }

  // 决定事件显示在时间轴的哪一侧
  const getEventSide = (eventType: JobEvent["eventType"]): 'left' | 'right' => {
    // rejected, offer_received, offer_accepted 在左边；applied, interview 在右边
    const leftSideEvents = ['rejected', 'offer_received', 'offer_accepted']
    return leftSideEvents.includes(eventType) ? 'left' : 'right'
  }

  const getEventConfig = (eventType: JobEvent["eventType"]) => {
    const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string; textColor: string }> = {
      'applied': {
        icon: Send,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800"
      },
      'interview': {
        icon: MessageSquare,
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-800"
      },
      'rejected': {
        icon: XCircle,
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-800"
      },
      'offer_received': {
        icon: Trophy,
        color: "bg-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-800"
      },
      'offer_accepted': {
        icon: CheckCircle,
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-800"
      }
    }
    return configs[eventType] || configs.applied
  }

  const getEventDisplayName = (eventType: JobEvent["eventType"], event?: TimelineEventDisplay): string => {
    if (eventType === 'interview' && event) {
      const interviewTypeDisplay = getInterviewTypeDisplay(event.interviewType)
      const round = event.interviewRound ? ` Round ${event.interviewRound}` : ''
      return `${interviewTypeDisplay}${round}`
    }

    const names: Record<string, string> = {
      'applied': 'Applied',
      'interview': 'Interview',
      'rejected': 'Rejected',
      'offer_received': 'Offer Received',
      'offer_accepted': 'Offer Accepted'
    }
    return names[eventType] || eventType
  }

  const getInterviewTypeDisplay = (interviewType?: string): string => {
    const typeMap: Record<string, string> = {
      'phone': 'Phone Interview',
      'video': 'Video Interview',
      'onsite': 'Onsite Interview',
      'technical': 'Technical Interview',
      'hr': 'HR Interview',
      'final': 'Final Interview',
      'oa': 'Online Assessment',
      'vo': 'Virtual Onsite'
    }
    return typeMap[interviewType || 'technical'] || 'Interview'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
  }

  const formatYear = (date: Date) => {
    return date.getFullYear().toString()
  }

  // 按年份分组事件
  const groupEventsByYear = (events: TimelineEventDisplay[]) => {
    const groups: { [year: string]: TimelineEventDisplay[] } = {}
    events.forEach(event => {
      const year = formatYear(event.date)
      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(event)
    })
    return groups
  }
  
  const getCompanyLogo = (company: string) => {
    const domain = company.toLowerCase().replace(/\s+/g, "")
    return `https://logo.clearbit.com/${domain}.com`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Timeline</h1>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Timeline</h1>
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
            <p className="text-gray-500">Your job application events will appear here as you progress through the hiring process.</p>
          </div>
        </div>
      </div>
    )
  }

  const eventsByYear = groupEventsByYear(timelineEvents)
  const years = Object.keys(eventsByYear).sort((a, b) => parseInt(b) - parseInt(a)) // 最新年份在前

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Timeline</h1>
        
        <div className="relative">
          {/* 中央时间轴线 */}
          <div className="absolute left-1/2 transform -translate-x-0.5 w-1 bg-gray-300 h-full"></div>
          
          {years.map((year, yearIndex) => (
            <div key={year} className="mb-8">
              {/* 该年的事件 */}
              <div className="space-y-12">
                {eventsByYear[year].map((event, index) => {
                  const config = getEventConfig(event.eventType)
                  const IconComponent = config.icon
                  
                  return (
                <div key={event.id} className="relative flex items-center">
                  {/* 左侧内容 - 镜像布局 */}
                  <div className="w-1/2 pr-8">
                    {event.side === 'left' && (
                      <div className={`${config.bgColor} rounded-lg p-6 shadow-sm border border-gray-200 ml-auto max-w-md`}>
                        <div className="flex justify-between items-center">
                          {/* 左侧公司信息（镜像布局） */}
                          <div className="flex flex-col items-left text-right">
                            <img
                              src={getCompanyLogo(event.company)}
                              alt={`${event.company} logo`}
                              className="w-12 h-12 mb-2 rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg?height=48&width=48&text=" + event.company.charAt(0);
                              }}
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">{event.company}</div>
                              {event.location && (
                                <div className="flex items-center justify-center text-xs text-gray-600 mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 右侧信息（镜像布局） */}
                          <div className="flex flex-col gap-1 items-end text-right">
                            <div className={`inline-block px-3 py-1 rounded text-sm font-bold text-white ${config.color}`}>
                              {getEventDisplayName(event.eventType, event)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(event.date)} {formatYear(event.date)}
                            </div>
                            <div className="flex items-center text-base font-medium text-gray-900">
                              <span>{event.position}</span>
                              <Briefcase className="w-4 h-4 ml-2 text-gray-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 中央时间点 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
                    <div className={`${config.color} rounded-full p-3 shadow-lg border-4 border-white`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* 右侧内容 - 按照你的设计 */}
                  <div className="w-1/2 pl-8">
                    {event.side === 'right' && (
                      <div className={`${config.bgColor} rounded-lg p-6 shadow-sm border border-gray-200 mr-auto max-w-md`}>
                        <div className="flex justify-between items-center">
                          {/* 左侧信息 */}
                          <div className="flex flex-col gap-1">
                            <div className={`inline-block px-3 py-1 rounded text-sm font-bold text-white ${config.color} w-fit`}>
                              {getEventDisplayName(event.eventType, event)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(event.date)} {formatYear(event.date)}
                            </div>
                            <div className="flex items-center text-base font-medium text-gray-900">
                              <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                              <span>{event.position}</span>
                            </div>
                          </div>
                          
                          {/* 右侧公司信息 */}
                          <div className="flex flex-col items-right text-left">
                            <img
                              src={getCompanyLogo(event.company)}
                              alt={`${event.company} logo`}
                              className="w-12 h-12 mb-2 rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg?height=48&width=48&text=" + event.company.charAt(0);
                              }}
                            />
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{event.company}</div>
                              {event.location && (
                                <div className="flex items-center justify-center text-xs text-gray-600 mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timeline

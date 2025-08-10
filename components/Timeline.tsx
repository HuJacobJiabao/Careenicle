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
  Building
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
  side: 'left' | 'right' // 决定卡片显示在时间轴的哪一侧
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
          // 只包含指定的事件类型
          const allowedEvents: JobEvent["eventType"][] = [
            'applied',
            'interview_scheduled', 
            'interview_completed',
            'rejected',
            'offer_received'
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
            side
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
      'offer_received': 10,
      'rejected': 9,
      'interview_completed': 8,
      'interview_scheduled': 7,
      'applied': 6
    }
    return priorities[eventType] || 1
  }

  // 决定事件显示在时间轴的哪一侧
  const getEventSide = (eventType: JobEvent["eventType"]): 'left' | 'right' => {
    // applied 和 interview 在右边，rejected 和 offer_received 在左边
    const rightSideEvents = ['applied', 'interview_scheduled', 'interview_completed']
    return rightSideEvents.includes(eventType) ? 'right' : 'left'
  }

  const getEventConfig = (eventType: JobEvent["eventType"]) => {
    const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string; textColor: string }> = {
      'applied': {
        icon: Send,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800"
      },
      'interview_scheduled': {
        icon: Calendar,
        color: "bg-amber-500",
        bgColor: "bg-amber-50",
        textColor: "text-amber-800"
      },
      'interview_completed': {
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
      }
    }
    return configs[eventType] || configs.applied
  }

  const getEventDisplayName = (eventType: JobEvent["eventType"]): string => {
    const names: Record<string, string> = {
      'applied': 'Applied',
      'interview_scheduled': 'Interview',
      'interview_completed': 'Interview',
      'rejected': 'Rejected',
      'offer_received': 'Offer Received'
    }
    return names[eventType] || eventType
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Timeline</h1>
        
        <div className="relative">
          {/* 中央时间轴线 */}
          <div className="absolute left-1/2 transform -translate-x-0.5 w-1 bg-gray-300 h-full"></div>
          
          <div className="space-y-8">
            {timelineEvents.map((event, index) => {
              const config = getEventConfig(event.eventType)
              const IconComponent = config.icon
              
              return (
                <div key={event.id} className="relative flex items-center">
                  {/* 左侧内容 */}
                  <div className="w-1/2 pr-8">
                    {event.side === 'left' && (
                      <div className={`${config.bgColor} rounded-lg p-6 shadow-sm border border-gray-200 ml-auto max-w-md`}>
                        <div className="flex items-center mb-3">
                          <div className={`${config.color} rounded-full p-2 mr-3`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${config.textColor}`}>
                              {getEventDisplayName(event.eventType)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(event.date)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <img
                              src={getCompanyLogo(event.company)}
                              alt={`${event.company} logo`}
                              className="w-6 h-6 rounded-full shadow-sm mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg?height=24&width=24&text=" + event.company.charAt(0);
                              }}
                            />
                            <span className="font-medium">{event.company}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{event.position}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 中央时间点 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`${config.color} rounded-full p-3 shadow-lg border-4 border-white`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* 右侧内容 */}
                  <div className="w-1/2 pl-8">
                    {event.side === 'right' && (
                      <div className={`${config.bgColor} rounded-lg p-6 shadow-sm border border-gray-200 mr-auto max-w-md`}>
                        <div className="flex items-center mb-3">
                          <div className={`${config.color} rounded-full p-2 mr-3`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${config.textColor}`}>
                              {getEventDisplayName(event.eventType)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(event.date)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <img
                              src={getCompanyLogo(event.company)}
                              alt={`${event.company} logo`}
                              className="w-6 h-6 rounded-full shadow-sm mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg?height=24&width=24&text=" + event.company.charAt(0);
                              }}
                            />
                            <span className="font-medium">{event.company}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{event.position}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

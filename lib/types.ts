export interface Job {
  id?: number
  company: string
  position: string
  jobUrl?: string
  applicationDate: Date
  status: "applied" | "interview" | "rejected" | "offer" | "accepted"
  location?: string
  notes?: string
  isFavorite?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Interview {
  id?: number
  jobId: number
  round: number
  type: "phone" | "video" | "onsite" | "technical" | "hr" | "final"
  scheduledDate: Date
  actualDate?: Date
  duration?: number
  interviewer?: string
  result: "pending" | "passed" | "failed" | "cancelled"
  feedback?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface JobEvent {
  id?: number
  jobId: number
  eventType: 
    | "applied" 
    | "interview_scheduled" 
    | "interview" 
    | "interview_result" 
    | "rejected" 
    | "offer_received" 
    | "offer_accepted"
    | "offer_declined"
    | "withdrawn"
    | "ghosted"
  eventDate: Date
  title: string
  description?: string
  
  // Interview specific fields
  interviewRound?: number
  interviewType?: "phone" | "video" | "onsite" | "technical" | "hr" | "final" | "oa" | "vo"  // Added oa and vo to existing types
  interviewer?: string
  interviewResult?: "pending" | "passed" | "failed" | "cancelled"
  
  // General fields
  notes?: string
  metadata?: any
  createdAt?: Date
  updatedAt?: Date
}

export interface TimelineEvent {
  id: string
  type: "application" | "interview" | "result" | "offer" | "status_change"
  company: string
  position: string
  date: Date
  title: string
  description: string
  status: string
  location?: string
  eventType?: JobEvent["eventType"]
}

export interface UpcomingInterviewJob extends Job {
  upcomingInterview: JobEvent
}

export interface LocationData {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  jobs: Job[]
}

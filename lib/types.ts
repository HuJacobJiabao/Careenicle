export interface Job {
  id?: number
  company: string
  position: string
  jobUrl: string
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

export interface TimelineEvent {
  id: string
  type: "application" | "interview" | "result"
  company: string
  position: string
  date: Date
  title: string
  description: string
  status: string
  location?: string
}

export interface UpcomingInterviewJob extends Job {
  upcomingInterview: Interview
}

export interface LocationData {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  jobs: Job[]
}

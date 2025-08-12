import type { Job, Interview, JobEvent } from "./types"

export const mockJobs: Job[] = [
  {
    id: 1,
    company: "Google",
    position: "Senior Software Engineer",
    jobUrl: "https://careers.google.com/jobs/123",
    applicationDate: new Date("2024-01-15"),
    status: "interview",
    location: "Mountain View, CA",
    notes: "Great company culture, tech stack matches my skills",
    isFavorite: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Frontend Developer",
    jobUrl: "https://careers.microsoft.com/jobs/456",
    applicationDate: new Date("2024-01-20"),
    status: "applied",
    location: "Seattle, WA",
    notes: "Frontend position with React stack",
    isFavorite: false,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: 3,
    company: "Apple",
    position: "iOS Developer",
    jobUrl: "https://jobs.apple.com/jobs/789",
    applicationDate: new Date("2024-01-25"),
    status: "rejected",
    location: "Cupertino, CA",
    notes: "Required more Swift experience",
    isFavorite: false,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: 4,
    company: "Meta",
    position: "Full Stack Engineer",
    jobUrl: "https://www.metacareers.com/jobs/101112",
    applicationDate: new Date("2024-02-01"),
    status: "offer",
    location: "Menlo Park, CA",
    notes: "Received offer, considering options",
    isFavorite: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: 5,
    company: "Amazon",
    position: "Cloud Engineer",
    jobUrl: "https://amazon.jobs/jobs/131415",
    applicationDate: new Date("2024-02-05"),
    status: "applied",
    location: "Austin, TX",
    notes: "AWS related position",
    isFavorite: false,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    id: 6,
    company: "Netflix",
    position: "Data Engineer",
    jobUrl: "https://jobs.netflix.com/jobs/161718",
    applicationDate: new Date("2024-02-10"),
    status: "interview",
    location: "Los Gatos, CA",
    notes: "Exciting data challenges",
    isFavorite: true,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: 7,
    company: "Spotify",
    position: "Backend Engineer",
    jobUrl: "https://www.lifeatspotify.com/jobs/192021",
    applicationDate: new Date("2024-02-12"),
    status: "applied",
    location: "New York, NY",
    notes: "Music streaming technology",
    isFavorite: false,
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
  {
    id: 8,
    company: "Tesla",
    position: "Software Engineer",
    jobUrl: "https://www.tesla.com/careers/job/123",
    applicationDate: new Date("2024-02-15"),
    status: "applied",
    location: "Palo Alto, CA",
    notes: "Electric vehicle technology",
    isFavorite: false,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 9,
    company: "Uber",
    position: "Senior Backend Engineer",
    jobUrl: "https://www.uber.com/careers/job/456",
    applicationDate: new Date("2024-02-18"),
    status: "interview",
    location: "San Francisco, CA",
    notes: "Ride-sharing platform",
    isFavorite: true,
    createdAt: new Date("2024-02-18"),
    updatedAt: new Date("2024-02-18"),
  },
  {
    id: 10,
    company: "Airbnb",
    position: "Product Manager",
    jobUrl: "https://careers.airbnb.com/job/789",
    applicationDate: new Date("2024-02-20"),
    status: "applied",
    location: "San Francisco, CA",
    notes: "Travel and hospitality",
    isFavorite: false,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: 11,
    company: "Local Startup",
    position: "Full Stack Developer",
    applicationDate: new Date("2025-01-10"),
    status: "applied",
    location: "Remote",
    notes: "Found through networking, no formal job posting",
    isFavorite: false,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
]

export const mockInterviews: Interview[] = [
  {
    id: 1,
    jobId: 1,
    round: 1,
    type: "technical",
    scheduledDate: new Date("2024-01-22T14:00:00"),
    interviewer: "John Smith",
    result: "passed",
    feedback: "Strong technical performance, solved algorithms correctly",
    notes: "Prepared common algorithm questions",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: 2,
    jobId: 1,
    round: 2,
    type: "hr",
    scheduledDate: new Date("2024-12-25T10:00:00"),
    interviewer: "Sarah Johnson",
    result: "pending",
    feedback: "",
    notes: "Waiting for HR interview results",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: 3,
    jobId: 4,
    round: 1,
    type: "phone",
    scheduledDate: new Date("2024-02-08T15:30:00"),
    interviewer: "Mike Wilson",
    result: "passed",
    feedback: "Phone interview went well, interested in project experience",
    notes: "Highlighted React project experience",
    createdAt: new Date("2024-02-08"),
    updatedAt: new Date("2024-02-08"),
  },
  {
    id: 4,
    jobId: 4,
    round: 2,
    type: "onsite",
    scheduledDate: new Date("2024-02-12T09:00:00"),
    interviewer: "Tech Team",
    result: "passed",
    feedback: "Onsite interview passed, great team atmosphere",
    notes: "Coding exercise completed successfully",
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
  {
    id: 5,
    jobId: 6,
    round: 1,
    type: "video",
    scheduledDate: new Date("2024-02-15T16:00:00"),
    interviewer: "Emma Davis",
    result: "passed",
    feedback: "Video interview successful, discussed data architecture",
    notes: "Focused on big data experience",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 6,
    jobId: 6,
    round: 2,
    type: "technical",
    scheduledDate: new Date("2024-12-20T10:00:00"),
    interviewer: "Alex Chen",
    result: "pending",
    feedback: "",
    notes: "Upcoming technical round",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: 7,
    jobId: 9,
    round: 1,
    type: "phone",
    scheduledDate: new Date("2024-12-18T14:00:00"),
    interviewer: "Sarah Lee",
    result: "pending",
    feedback: "",
    notes: "Initial phone screening",
    createdAt: new Date("2024-02-18"),
    updatedAt: new Date("2024-02-18"),
  },
  {
    id: 8,
    jobId: 9,
    round: 2,
    type: "technical",
    scheduledDate: new Date("2024-12-22T15:30:00"),
    interviewer: "David Kim",
    result: "pending",
    feedback: "",
    notes: "Technical assessment",
    createdAt: new Date("2024-02-22"),
    updatedAt: new Date("2024-02-22"),
  },
]

export const generateMockJobEvents = (): JobEvent[] => {
  const events: JobEvent[] = []
  let eventId = 1

  // Generate application events for all jobs
  mockJobs.forEach((job) => {
    events.push({
      id: eventId++,
      jobId: job.id!,
      eventType: "applied",
      eventDate: job.applicationDate,
      title: `Applied to ${job.company}`,
      description: `Applied for ${job.position} position at ${job.company}`,
      notes: job.notes,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })

    // Generate status-based events
    if (job.status === "rejected") {
      const rejectionDate = new Date(job.applicationDate)
      rejectionDate.setDate(rejectionDate.getDate() + Math.floor(Math.random() * 14) + 7) // 1-3 weeks later
      events.push({
        id: eventId++,
        jobId: job.id!,
        eventType: "rejected",
        eventDate: rejectionDate,
        title: `Rejected by ${job.company}`,
        description: `Application for ${job.position} was not successful`,
        createdAt: rejectionDate,
        updatedAt: rejectionDate,
      })
    } else if (job.status === "offer") {
      const offerDate = new Date(job.applicationDate)
      offerDate.setDate(offerDate.getDate() + Math.floor(Math.random() * 21) + 14) // 2-5 weeks later
      events.push({
        id: eventId++,
        jobId: job.id!,
        eventType: "offer_received",
        eventDate: offerDate,
        title: `Offer from ${job.company}`,
        description: `Received job offer for ${job.position} position`,
        createdAt: offerDate,
        updatedAt: offerDate,
      })
    } else if (job.status === "accepted") {
      const offerDate = new Date(job.applicationDate)
      offerDate.setDate(offerDate.getDate() + Math.floor(Math.random() * 21) + 14)
      const acceptDate = new Date(offerDate)
      acceptDate.setDate(acceptDate.getDate() + Math.floor(Math.random() * 7) + 1) // 1-7 days after offer

      events.push({
        id: eventId++,
        jobId: job.id!,
        eventType: "offer_received",
        eventDate: offerDate,
        title: `Offer from ${job.company}`,
        description: `Received job offer for ${job.position} position`,
        createdAt: offerDate,
        updatedAt: offerDate,
      })

      events.push({
        id: eventId++,
        jobId: job.id!,
        eventType: "offer_accepted",
        eventDate: acceptDate,
        title: `Accepted offer from ${job.company}`,
        description: `Accepted job offer for ${job.position} position`,
        createdAt: acceptDate,
        updatedAt: acceptDate,
      })
    }
  })

  // Generate interview events from mockInterviews
  mockInterviews.forEach((interview) => {
    events.push({
      id: eventId++,
      jobId: interview.jobId,
      eventType: "interview",
      eventDate: interview.scheduledDate,
      title: `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview`,
      description: `Round ${interview.round} ${interview.type} interview${interview.interviewer ? ` with ${interview.interviewer}` : ""}`,
      interviewRound: interview.round,
      interviewType: interview.type,
      interviewer: interview.interviewer,
      interviewResult: interview.result,
      notes: interview.notes,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    })
  })

  return events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
}

export const mockJobEvents = generateMockJobEvents()

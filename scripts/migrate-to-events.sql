-- Migration script to add job events tracking
-- This will create a new events table to track all job-related events

-- Create job_events table
CREATE TABLE IF NOT EXISTS job_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'applied', 
        'interview_scheduled', 
        'interview_completed', 
        'interview_result', 
        'rejected', 
        'offer_received', 
        'offer_accepted', 
        'offer_declined',
        'withdrawn',
        'ghosted'
    )),
    event_date TIMESTAMP NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Interview specific fields (nullable for non-interview events)
    interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
    interview_round INTEGER,
    interview_type VARCHAR(50) CHECK (interview_type IN ('phone', 'video', 'onsite', 'technical', 'hr', 'final')),
    interviewer VARCHAR(255),
    interview_result VARCHAR(50) CHECK (interview_result IN ('pending', 'passed', 'failed', 'cancelled')),
    
    -- General event fields
    notes TEXT,
    metadata JSONB, -- For storing additional flexible data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_event_type ON job_events(event_type);
CREATE INDEX IF NOT EXISTS idx_job_events_event_date ON job_events(event_date);
CREATE INDEX IF NOT EXISTS idx_job_events_interview_id ON job_events(interview_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_job_events_updated_at BEFORE UPDATE ON job_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from jobs table
INSERT INTO job_events (job_id, event_type, event_date, title, description, notes, created_at)
SELECT 
    id,
    'applied',
    application_date,
    CONCAT('Applied to ', company, ' for ', position),
    CONCAT('Applied for ', position, ' position at ', company),
    notes,
    created_at
FROM jobs;

-- Migrate existing interview data
INSERT INTO job_events (
    job_id, 
    event_type, 
    event_date, 
    title, 
    description, 
    interview_id,
    interview_round,
    interview_type,
    interviewer,
    interview_result,
    notes,
    created_at
)
SELECT 
    i.job_id,
    CASE 
        WHEN i.actual_date IS NOT NULL THEN 'interview_completed'
        ELSE 'interview_scheduled'
    END,
    COALESCE(i.actual_date, i.scheduled_date),
    CONCAT('Round ', i.round, ' ', 
        CASE i.type
            WHEN 'phone' THEN 'Phone Interview'
            WHEN 'video' THEN 'Video Interview'
            WHEN 'onsite' THEN 'Onsite Interview'
            WHEN 'technical' THEN 'Technical Interview'
            WHEN 'hr' THEN 'HR Interview'
            WHEN 'final' THEN 'Final Interview'
            ELSE 'Interview'
        END,
        ' with ', j.company
    ),
    CONCAT(
        CASE i.type
            WHEN 'phone' THEN 'Phone Interview'
            WHEN 'video' THEN 'Video Interview'
            WHEN 'onsite' THEN 'Onsite Interview'
            WHEN 'technical' THEN 'Technical Interview'
            WHEN 'hr' THEN 'HR Interview'
            WHEN 'final' THEN 'Final Interview'
            ELSE 'Interview'
        END,
        CASE WHEN i.interviewer IS NOT NULL THEN CONCAT(' with ', i.interviewer) ELSE '' END
    ),
    i.id,
    i.round,
    i.type,
    i.interviewer,
    i.result,
    COALESCE(i.notes, i.feedback),
    i.created_at
FROM interviews i
JOIN jobs j ON i.job_id = j.id;

-- Add interview result events for completed interviews
INSERT INTO job_events (
    job_id, 
    event_type, 
    event_date, 
    title, 
    description, 
    interview_id,
    interview_round,
    interview_result,
    notes,
    created_at
)
SELECT 
    i.job_id,
    'interview_result',
    COALESCE(i.actual_date, i.scheduled_date) + INTERVAL '1 hour', -- Assume result comes 1 hour after interview
    CONCAT('Round ', i.round, ' Interview Result - ', 
        CASE i.result
            WHEN 'passed' THEN 'Passed'
            WHEN 'failed' THEN 'Failed'
            WHEN 'cancelled' THEN 'Cancelled'
            ELSE 'Pending'
        END
    ),
    CONCAT('Interview result: ', i.result),
    i.id,
    i.round,
    i.result,
    i.feedback,
    i.created_at
FROM interviews i
JOIN jobs j ON i.job_id = j.id
WHERE i.result != 'pending';

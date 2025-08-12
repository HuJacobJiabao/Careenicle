-- Job Tracker Database Schema Setup Script
-- This script creates the database schema with location support and interview_link field

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS job_events CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Create jobs table with location support
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'rejected', 'offer', 'accepted')),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    formatted_address TEXT,
    place_id VARCHAR(255),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job_events table with interview_link instead of interviewer
CREATE TABLE job_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'applied', 
        'interview_scheduled', 
        'interview', 
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
    interview_round INTEGER,
    interview_type VARCHAR(50) CHECK (interview_type IN ('phone', 'video', 'onsite', 'technical', 'hr', 'final', 'oa', 'vo')),
    interview_link TEXT, -- Changed from interviewer to interview_link
    interview_result VARCHAR(50) CHECK (interview_result IN ('pending', 'passed', 'failed', 'cancelled')),
    
    -- General event fields
    notes TEXT,
    metadata JSONB, -- For storing additional flexible data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_application_date ON jobs(application_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_position ON jobs(position);
CREATE INDEX idx_jobs_favorite ON jobs(is_favorite);
CREATE INDEX idx_jobs_latitude ON jobs(latitude);
CREATE INDEX idx_jobs_longitude ON jobs(longitude);
CREATE INDEX idx_jobs_location_coords ON jobs(latitude, longitude);
CREATE INDEX idx_job_events_job_id ON job_events(job_id);
CREATE INDEX idx_job_events_event_type ON job_events(event_type);
CREATE INDEX idx_job_events_event_date ON job_events(event_date);

-- Add comments for documentation
COMMENT ON COLUMN jobs.latitude IS 'Latitude coordinate for job location';
COMMENT ON COLUMN jobs.longitude IS 'Longitude coordinate for job location';
COMMENT ON COLUMN jobs.formatted_address IS 'Google Maps formatted address';
COMMENT ON COLUMN jobs.place_id IS 'Google Places API place ID for caching';
COMMENT ON COLUMN job_events.interview_link IS 'Link to interview meeting (Zoom, Google Meet, etc.)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_events_updated_at BEFORE UPDATE ON job_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

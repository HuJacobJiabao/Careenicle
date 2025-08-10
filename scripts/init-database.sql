-- Create database (run this first)
-- CREATE DATABASE jobtracker;

-- Connect to jobtracker database and run the following:

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_url TEXT NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'rejected', 'offer', 'accepted')),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('phone', 'video', 'onsite', 'technical', 'hr', 'final')),
    scheduled_date TIMESTAMP NOT NULL,
    actual_date TIMESTAMP,
    duration INTEGER, -- in minutes
    interviewer VARCHAR(255),
    result VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'failed', 'cancelled')),
    feedback TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_application_date ON jobs(application_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);

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

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

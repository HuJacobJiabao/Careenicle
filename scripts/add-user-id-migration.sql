-- Migration script to add user_id column to support multi-user functionality
-- Run this script in your Supabase SQL editor

-- Add user_id column to jobs table
-- Using uuid to reference auth.users table in Supabase
ALTER TABLE jobs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to job_events table  
ALTER TABLE job_events ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance on user-based queries
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_job_events_user_id ON job_events(user_id);

-- Add composite indexes for common query patterns
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_user_date ON jobs(user_id, application_date);
CREATE INDEX idx_job_events_user_date ON job_events(user_id, event_date);

-- Add Row Level Security (RLS) policies
-- Enable RLS on both tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_events ENABLE ROW LEVEL SECURITY;

-- Policy for jobs table: users can only see their own jobs
CREATE POLICY "Users can view their own jobs" ON jobs
  FOR ALL USING (auth.uid() = user_id);

-- Policy for job_events table: users can only see their own job events
CREATE POLICY "Users can view their own job events" ON job_events
  FOR ALL USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON COLUMN jobs.user_id IS 'References auth.users(id) - owner of the job application';
COMMENT ON COLUMN job_events.user_id IS 'References auth.users(id) - owner of the job event';

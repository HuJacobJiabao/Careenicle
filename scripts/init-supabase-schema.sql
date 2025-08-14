-- Supabase Database Schema for Job Tracker Application
-- Run this SQL in your Supabase SQL Editor

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id BIGSERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'rejected', 'offer', 'accepted')),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_events table
CREATE TABLE IF NOT EXISTS public.job_events (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'applied', 
        'interview_scheduled', 
        'interview', 
        'interview_result', 
        'rejected', 
        'offer_received', 
        'offer_accepted', 
        'withdrawn', 
        'ghosted'
    )),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    interview_round INTEGER,
    interview_type VARCHAR(50),
    interview_link TEXT,
    interview_result VARCHAR(50),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_application_date ON public.jobs(application_date);
CREATE INDEX IF NOT EXISTS idx_jobs_is_favorite ON public.jobs(is_favorite);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON public.job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_event_type ON public.job_events(event_type);
CREATE INDEX IF NOT EXISTS idx_job_events_event_date ON public.job_events(event_date);
CREATE INDEX IF NOT EXISTS idx_job_events_created_at ON public.job_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_events_updated_at ON public.job_events;
CREATE TRIGGER update_job_events_updated_at
    BEFORE UPDATE ON public.job_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (you can adjust these based on your auth requirements)
-- For now, allowing full access to authenticated users
CREATE POLICY "Enable all access for authenticated users" ON public.jobs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.job_events
    FOR ALL USING (auth.role() = 'authenticated');

-- If you want to allow anonymous access (for development), use these policies instead:
-- CREATE POLICY "Enable all access for everyone" ON public.jobs FOR ALL USING (true);
-- CREATE POLICY "Enable all access for everyone" ON public.job_events FOR ALL USING (true);

-- Insert some sample data (optional)
INSERT INTO public.jobs (company, position, application_date, status, location, notes, is_favorite) VALUES
('Google', 'Software Engineer', '2024-01-15', 'interview', 'Mountain View, CA', 'Applied through referral', true),
('Microsoft', 'Senior Developer', '2024-01-20', 'applied', 'Seattle, WA', 'Found on LinkedIn', false),
('Meta', 'Frontend Engineer', '2024-01-25', 'rejected', 'Menlo Park, CA', 'Phone screening completed', false)
ON CONFLICT DO NOTHING;

-- Get the job IDs for sample events
DO $$
DECLARE
    google_job_id BIGINT;
    microsoft_job_id BIGINT;
    meta_job_id BIGINT;
BEGIN
    SELECT id INTO google_job_id FROM public.jobs WHERE company = 'Google' LIMIT 1;
    SELECT id INTO microsoft_job_id FROM public.jobs WHERE company = 'Microsoft' LIMIT 1;
    SELECT id INTO meta_job_id FROM public.jobs WHERE company = 'Meta' LIMIT 1;
    
    IF google_job_id IS NOT NULL THEN
        INSERT INTO public.job_events (job_id, event_type, event_date, title, description) VALUES
        (google_job_id, 'applied', '2024-01-15', 'Application Submitted', 'Applied through company website'),
        (google_job_id, 'interview_scheduled', '2024-01-22', 'Phone Interview Scheduled', 'Initial screening call with recruiter')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF microsoft_job_id IS NOT NULL THEN
        INSERT INTO public.job_events (job_id, event_type, event_date, title, description) VALUES
        (microsoft_job_id, 'applied', '2024-01-20', 'Application Submitted', 'Applied via LinkedIn')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF meta_job_id IS NOT NULL THEN
        INSERT INTO public.job_events (job_id, event_type, event_date, title, description) VALUES
        (meta_job_id, 'applied', '2024-01-25', 'Application Submitted', 'Applied through referral'),
        (meta_job_id, 'interview', '2024-02-01', 'Phone Screening', 'Technical phone interview'),
        (meta_job_id, 'rejected', '2024-02-03', 'Application Rejected', 'Did not pass phone screening')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

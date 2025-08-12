-- Job Tracker Database Setup Script
-- This script creates the complete database schema and populates it with sample data

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS job_events CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Create jobs table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'rejected', 'offer', 'accepted')),
    location VARCHAR(255),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job_events table
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
    interviewer VARCHAR(255),
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
CREATE INDEX idx_job_events_job_id ON job_events(job_id);
CREATE INDEX idx_job_events_event_type ON job_events(event_type);
CREATE INDEX idx_job_events_event_date ON job_events(event_date);

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

-- Insert sample jobs data
INSERT INTO jobs (company, position, job_url, application_date, status, location, notes, is_favorite) VALUES
('Google', 'Software Engineer', 'https://careers.google.com/jobs/123', '2025-01-15', 'applied', 'Mountain View, CA', 'Applied through university career portal', true),
('Microsoft', 'Frontend Developer', 'https://careers.microsoft.com/us/en/job/456', '2025-01-25', 'interview', 'Seattle, WA', 'Referred by former colleague', false),
('Apple', 'iOS Developer', 'https://jobs.apple.com/en-us/details/789', '2025-02-05', 'rejected', 'Cupertino, CA', 'Phone screen went well but rejected after technical', false),
('Netflix', 'Data Engineer', 'https://jobs.netflix.com/jobs/012', '2025-02-15', 'offer', 'Los Gatos, CA', 'Great company culture', true),
('Meta', 'Full Stack Engineer', 'https://www.metacareers.com/jobs/345', '2025-02-20', 'applied', 'Menlo Park, CA', 'Applied directly on website', false),
('Amazon', 'Cloud Engineer', 'https://amazon.jobs/en/jobs/678', '2025-02-28', 'interview', 'Austin, TX', 'AWS focused role', false),
('Tesla', 'Software Engineer', 'https://www.tesla.com/careers/job/901', '2025-03-10', 'applied', 'Palo Alto, CA', 'Automotive software position', true),
('Spotify', 'Backend Engineer', 'https://www.lifeatspotify.com/jobs/234', '2025-03-15', 'applied', 'New York, NY', 'Music streaming backend', false),
('Uber', 'Senior Backend Engineer', 'https://www.uber.com/careers/list/567', '2025-02-18', 'applied', 'San Francisco, CA', 'Ride-sharing platform backend', false),
('Airbnb', 'Product Manager', 'https://careers.airbnb.com/positions/890', '2025-02-20', 'applied', 'San Francisco, CA', 'Travel platform product management', true),
('Xiaomi', 'Software Engineer', 'https://careers.xiaomi.com/jobs/123', '2025-08-13', 'interview', 'Beijing, China', 'Mobile technology company', false),
('Local Startup', 'Full Stack Developer', NULL, '2025-03-01', 'applied', 'Remote', 'Found through networking, no formal job posting', false);

-- Insert sample job_events data
INSERT INTO job_events (job_id, event_type, event_date, title, description, interview_round, interview_type, interviewer, interview_result, notes) VALUES
-- Google events
(1, 'applied', '2025-01-15 09:00:00', 'Application Submitted', 'Applied for Software Engineer position at Google', NULL, NULL, NULL, NULL, 'Applied through university portal'),

-- Microsoft events  
(2, 'applied', '2025-01-25 10:00:00', 'Application Submitted', 'Applied for Frontend Developer position at Microsoft', NULL, NULL, NULL, NULL, 'Referred by John Smith'),
(2, 'interview_scheduled', '2025-02-01 14:00:00', 'Round 1 Phone Interview Scheduled', 'Phone screening with hiring manager', 1, 'phone', 'Sarah Johnson', 'pending', 'Initial screening call'),
(2, 'interview', '2025-02-05 14:00:00', 'Round 1 Phone Interview', 'Phone screening with hiring manager', 1, 'phone', 'Sarah Johnson', 'passed', 'Good technical discussion'),
(2, 'interview_scheduled', '2025-02-08 16:00:00', 'Round 2 Technical Interview Scheduled', 'Virtual technical interview', 2, 'technical', 'Mike Chen', 'pending', 'Coding challenge interview'),

-- Apple events
(3, 'applied', '2025-02-05 11:00:00', 'Application Submitted', 'Applied for iOS Developer position at Apple', NULL, NULL, NULL, NULL, 'Direct application'),
(3, 'interview_scheduled', '2025-02-12 15:00:00', 'Phone Screen Scheduled', 'Initial phone screening', 1, 'phone', 'Lisa Wang', 'pending', 'HR screening call'),
(3, 'interview', '2025-02-15 15:00:00', 'Phone Screen', 'Initial phone screening', 1, 'phone', 'Lisa Wang', 'passed', 'Positive feedback'),
(3, 'interview_scheduled', '2025-02-18 10:00:00', 'Technical Interview Scheduled', 'Technical coding interview', 2, 'technical', 'David Kim', 'pending', 'iOS coding challenge'),
(3, 'interview', '2025-02-22 10:00:00', 'Technical Interview', 'Technical coding interview', 2, 'technical', 'David Kim', 'failed', 'Struggled with algorithm questions'),
(3, 'rejected', '2025-02-25 09:00:00', 'Application Rejected', 'Unfortunately, we have decided to move forward with other candidates', NULL, NULL, NULL, NULL, 'Rejected after technical round'),

-- Netflix events
(4, 'applied', '2025-02-15 12:00:00', 'Application Submitted', 'Applied for Data Engineer position at Netflix', NULL, NULL, NULL, NULL, 'Applied online'),
(4, 'interview_scheduled', '2025-02-22 11:00:00', 'Video Interview Scheduled', 'Virtual interview with team lead', 1, 'video', 'Amanda Rodriguez', 'pending', 'Team fit discussion'),
(4, 'interview', '2025-02-25 11:00:00', 'Video Interview', 'Virtual interview with team lead', 1, 'video', 'Amanda Rodriguez', 'passed', 'Great cultural fit'),
(4, 'interview_scheduled', '2025-02-28 14:00:00', 'Technical Interview Scheduled', 'Data engineering technical round', 2, 'technical', 'James Wilson', 'pending', 'SQL and Python assessment'),
(4, 'interview', '2025-03-03 14:00:00', 'Technical Interview', 'Data engineering technical round', 2, 'technical', 'James Wilson', 'passed', 'Strong technical skills'),
(4, 'interview_scheduled', '2025-03-06 16:00:00', 'Final Interview Scheduled', 'Final round with director', 3, 'final', 'Dr. Robert Chen', 'pending', 'Final decision round'),
(4, 'interview', '2025-03-10 16:00:00', 'Final Interview', 'Final round with director', 3, 'final', 'Dr. Robert Chen', 'passed', 'Excellent performance'),
(4, 'offer_received', '2025-03-12 10:00:00', 'Job Offer Received', 'Received offer for Data Engineer position', NULL, NULL, NULL, NULL, 'Competitive salary package'),

-- Meta events
(5, 'applied', '2025-02-20 13:00:00', 'Application Submitted', 'Applied for Full Stack Engineer position at Meta', NULL, NULL, NULL, NULL, 'Direct website application'),

-- Amazon events
(6, 'applied', '2025-02-28 14:00:00', 'Application Submitted', 'Applied for Cloud Engineer position at Amazon', NULL, NULL, NULL, NULL, 'AWS certification mentioned'),
(6, 'interview_scheduled', '2025-03-05 09:00:00', 'Online Assessment Scheduled', 'Coding assessment and behavioral questions', 1, 'oa', NULL, 'pending', 'HackerRank assessment'),
(6, 'interview', '2025-03-08 09:00:00', 'Online Assessment', 'Coding assessment and behavioral questions', 1, 'oa', NULL, 'passed', 'Completed successfully'),

-- Tesla events
(7, 'applied', '2025-03-10 15:00:00', 'Application Submitted', 'Applied for Software Engineer position at Tesla', NULL, NULL, NULL, NULL, 'Automotive software focus'),

-- Spotify events
(8, 'applied', '2025-03-15 16:00:00', 'Application Submitted', 'Applied for Backend Engineer position at Spotify', NULL, NULL, NULL, NULL, 'Music streaming backend'),

-- Uber events
(9, 'applied', '2025-02-18 16:30:00', 'Application Submitted', 'Applied for Senior Backend Engineer position at Uber', NULL, NULL, NULL, NULL, 'Ride-sharing platform'),

-- Airbnb events
(10, 'applied', '2025-02-20 17:00:00', 'Application Submitted', 'Applied for Product Manager position at Airbnb', NULL, NULL, NULL, NULL, 'Travel platform PM role'),

-- Xiaomi events (with oa and vo interview types)
(11, 'applied', '2025-08-13 10:00:00', 'Application Submitted', 'Applied for Software Engineer position at Xiaomi', NULL, NULL, NULL, NULL, 'Mobile technology company'),
(11, 'interview_scheduled', '2025-08-20 14:00:00', 'Round 1 Technical Interview Scheduled', 'Technical screening with engineer', 1, 'technical', 'Zhang Wei', 'pending', 'Algorithm and data structures'),
(11, 'interview', '2025-08-13 14:00:00', 'Round 1 Technical Interview', 'Technical screening with engineer', 1, 'technical', 'Zhang Wei', 'passed', 'Strong problem-solving skills'),
(11, 'interview_scheduled', '2025-08-27 16:00:00', 'Virtual Onsite Scheduled', 'Full day virtual onsite interviews', 2, 'vo', 'Engineering Team', 'pending', '4-hour virtual onsite session'),

-- Local Startup events (ID 12)
(12, 'applied', '2025-03-01 09:00:00', 'Application Submitted', 'Applied for Full Stack Developer position at Local Startup', NULL, NULL, NULL, NULL, 'Found through networking event');

-- Print success message
SELECT 'Database setup completed successfully! Created ' || 
       (SELECT COUNT(*) FROM jobs) || ' jobs and ' || 
       (SELECT COUNT(*) FROM job_events) || ' job events.' as result;

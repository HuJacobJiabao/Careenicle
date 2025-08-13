-- Create jobs table in Supabase
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  application_date DATE,
  status VARCHAR(50) DEFAULT 'applied',
  notes TEXT,
  salary_range VARCHAR(100),
  job_url VARCHAR(500),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create job_events table in Supabase
CREATE TABLE IF NOT EXISTS job_events (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_application_date ON jobs(application_date);
CREATE INDEX IF NOT EXISTS idx_jobs_is_favorite ON jobs(is_favorite);
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_event_date ON job_events(event_date);
CREATE INDEX IF NOT EXISTS idx_job_events_event_type ON job_events(event_type);

-- Insert sample data
INSERT INTO jobs (company, position, location, application_date, status, notes, salary_range, is_favorite) VALUES
('Google', 'Software Engineer', 'Mountain View, CA', '2024-01-15', 'interview', 'Applied through referral', '$120k-$180k', true),
('Microsoft', 'Frontend Developer', 'Seattle, WA', '2024-01-20', 'applied', 'Found on LinkedIn', '$100k-$150k', false),
('Apple', 'iOS Developer', 'Cupertino, CA', '2024-01-25', 'rejected', 'Technical interview completed', '$130k-$200k', false),
('Meta', 'Full Stack Engineer', 'Menlo Park, CA', '2024-02-01', 'offer', 'Great team culture', '$140k-$220k', true),
('Netflix', 'Backend Engineer', 'Los Gatos, CA', '2024-02-05', 'applied', 'Interesting tech stack', '$110k-$170k', false);

-- Insert sample job events
INSERT INTO job_events (job_id, event_type, event_date, description, notes) VALUES
(1, 'application', '2024-01-15', 'Applied for Software Engineer position', 'Submitted through company website'),
(1, 'phone_screen', '2024-01-22', 'Phone screening with recruiter', 'Went well, moving to technical round'),
(1, 'technical_interview', '2024-01-29', 'Technical interview scheduled', 'System design and coding questions'),
(2, 'application', '2024-01-20', 'Applied for Frontend Developer role', 'Applied via LinkedIn'),
(3, 'application', '2024-01-25', 'Applied for iOS Developer position', 'Direct application'),
(3, 'rejection', '2024-02-10', 'Application rejected', 'Not a good fit for current needs'),
(4, 'application', '2024-02-01', 'Applied for Full Stack Engineer role', 'Referral application'),
(4, 'offer', '2024-02-15', 'Job offer received', 'Competitive package offered'),
(5, 'application', '2024-02-05', 'Applied for Backend Engineer position', 'Applied through careers page');

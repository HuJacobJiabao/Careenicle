-- Insert sample jobs data with location coordinates
INSERT INTO jobs (company, position, job_url, application_date, status, location, latitude, longitude, formatted_address, notes, is_favorite) VALUES
('Google', 'Software Engineer', 'https://careers.google.com/jobs/123', '2025-01-15', 'applied', 'Mountain View, CA', 37.4419, -122.1430, 'Mountain View, CA, USA', 'Applied through university career portal', true),
('Microsoft', 'Frontend Developer', 'https://careers.microsoft.com/us/en/job/456', '2025-01-25', 'interview', 'Seattle, WA', 47.6062, -122.3321, 'Seattle, WA, USA', 'Referred by former colleague', false),
('Apple', 'iOS Developer', 'https://jobs.apple.com/en-us/details/789', '2025-02-05', 'rejected', 'Cupertino, CA', 37.3230, -122.0322, 'Cupertino, CA, USA', 'Phone screen went well but rejected after technical', false),
('Netflix', 'Data Scientist', 'https://jobs.netflix.com/jobs/890123', '2025-02-10', 'applied', 'Los Gatos, CA', 37.2358, -121.9623, 'Los Gatos, CA, USA', 'Strong background in ML required', true),
('Amazon', 'Cloud Engineer', 'https://amazon.jobs/en/jobs/567890', '2025-02-20', 'offer', 'Austin, TX', 30.2672, -97.7431, 'Austin, TX, USA', 'Great team culture and benefits', false),
('Meta', 'Product Manager', 'https://www.metacareers.com/jobs/234567', '2025-03-01', 'interview', 'Menlo Park, CA', 37.4529, -122.1817, 'Menlo Park, CA, USA', 'Focus on AR/VR products', true),
('Tesla', 'Automotive Software Engineer', 'https://www.tesla.com/careers/search/job/345678', '2025-03-10', 'applied', 'Fremont, CA', 37.5485, -121.9886, 'Fremont, CA, USA', 'Autonomous driving team', false),
('Spotify', 'Backend Engineer', 'https://www.lifeatspotify.com/jobs/234', '2025-03-15', 'applied', 'New York, NY', 40.7128, -74.0060, 'New York, NY, USA', 'Music streaming backend', false),
('Airbnb', 'UX Designer', 'https://careers.airbnb.com/positions/567', '2025-03-20', 'rejected', 'San Francisco, CA', 37.7749, -122.4194, 'San Francisco, CA, USA', 'Portfolio review did not pass', false),
('Uber', 'Mobile Developer', 'https://www.uber.com/careers/list/890', '2025-03-25', 'interview', 'San Francisco, CA', 37.7749, -122.4194, 'San Francisco, CA, USA', 'Rider app team', true),
('Slack', 'DevOps Engineer', 'https://slack.com/careers/123', '2025-04-01', 'applied', 'San Francisco, CA', 37.7749, -122.4194, 'San Francisco, CA, USA', 'Infrastructure automation focus', false),
('Dropbox', 'Security Engineer', 'https://jobs.dropbox.com/listing/456', '2025-04-05', 'applied', 'San Francisco, CA', 37.7749, -122.4194, 'San Francisco, CA, USA', 'Cloud security specialist', false),
('LinkedIn', 'Growth Engineer', 'https://careers.linkedin.com/jobs/789', '2025-04-10', 'interview', 'Sunnyvale, CA', 37.3688, -122.0363, 'Sunnyvale, CA, USA', 'A/B testing and analytics', false),
('Salesforce', 'Cloud Solutions Architect', 'https://salesforce.com/careers/789', '2025-04-15', 'applied', 'San Francisco, CA', 37.7749, -122.4194, 'San Francisco, CA, USA', 'Enterprise solutions focus', true),
('Adobe', 'Creative Cloud Engineer', 'https://adobe.wd5.myworkdayjobs.com/external_experienced/job/321', '2025-04-20', 'applied', 'San Jose, CA', 37.3382, -121.8863, 'San Jose, CA, USA', 'Creative tools development', false),
('Zoom', 'Video Platform Engineer', 'https://zoom.wd5.myworkdayjobs.com/Zoom/job/654', '2025-04-25', 'applied', 'San Jose, CA', 37.3382, -121.8863, 'San Jose, CA, USA', 'Real-time video processing', false);

-- Insert sample job events with interview_link instead of interviewer
INSERT INTO job_events (job_id, event_type, event_date, title, description, interview_round, interview_type, interview_link, interview_result, notes) VALUES
-- Google events
(1, 'applied', '2025-01-15 09:00:00', 'Applied to Google SWE Position', 'Submitted application through university career portal', NULL, NULL, NULL, NULL, 'Used referral code from alumni'),
(1, 'interview_scheduled', '2025-01-20 14:30:00', 'Phone Screen Scheduled', 'Initial phone screening with recruiter', 1, 'phone', 'https://meet.google.com/abc-defg-hij', 'pending', 'Recruiter: Sarah Johnson'),

-- Microsoft events  
(2, 'applied', '2025-01-25 10:15:00', 'Applied to Microsoft Frontend Role', 'Application submitted with referral', NULL, NULL, NULL, NULL, 'Referred by John Smith'),
(2, 'interview_scheduled', '2025-02-01 11:00:00', 'Technical Interview Scheduled', 'Technical round with frontend team', 1, 'technical', 'https://teams.microsoft.com/l/meetup-join/xyz123', 'pending', 'Focus on React and TypeScript'),
(2, 'interview', '2025-02-01 11:00:00', 'Technical Interview Completed', 'Completed technical interview', 1, 'technical', 'https://teams.microsoft.com/l/meetup-join/xyz123', 'passed', 'Solved coding problems successfully'),

-- Apple events
(3, 'applied', '2025-02-05 16:20:00', 'Applied to Apple iOS Developer Position', 'Online application submission', NULL, NULL, NULL, NULL, 'Highlighted Swift and iOS experience'),
(3, 'interview_scheduled', '2025-02-12 09:30:00', 'Phone Screen Scheduled', 'Initial screening call', 1, 'phone', 'tel:+1-408-555-0123', 'pending', 'Recruiter will call'),
(3, 'interview', '2025-02-12 09:30:00', 'Phone Screen Completed', 'Completed initial phone screening', 1, 'phone', 'tel:+1-408-555-0123', 'passed', 'Discussed iOS experience'),
(3, 'interview_scheduled', '2025-02-18 14:00:00', 'Technical Interview Scheduled', 'Technical round for iOS development', 2, 'technical', 'https://zoom.us/j/1234567890', 'pending', 'Live coding session'),
(3, 'interview', '2025-02-18 14:00:00', 'Technical Interview Completed', 'Completed technical interview', 2, 'technical', 'https://zoom.us/j/1234567890', 'failed', 'Struggled with algorithm questions'),
(3, 'rejected', '2025-02-20 10:00:00', 'Application Rejected', 'Received rejection email', NULL, NULL, NULL, NULL, 'Technical performance not sufficient'),

-- Meta events
(6, 'applied', '2025-03-01 13:45:00', 'Applied to Meta PM Role', 'Product Manager application submitted', NULL, NULL, NULL, NULL, 'Focus on AR/VR products'),
(6, 'interview_scheduled', '2025-03-08 10:00:00', 'Recruiter Call Scheduled', 'Initial recruiter screening', 1, 'phone', 'https://workplace.meta.com/meeting/abc123', 'pending', 'Overview of role and process'),

-- Uber events
(10, 'applied', '2025-03-25 11:30:00', 'Applied to Uber Mobile Developer Position', 'Mobile development role application', NULL, NULL, NULL, NULL, 'Rider app team focus'),
(10, 'interview_scheduled', '2025-04-02 15:00:00', 'Technical Phone Screen Scheduled', 'Mobile development technical screen', 1, 'technical', 'https://uber.zoom.us/j/9876543210', 'pending', 'iOS/Android development focus'),

-- LinkedIn events
(13, 'applied', '2025-04-10 09:15:00', 'Applied to LinkedIn Growth Engineer Role', 'Growth engineering position application', NULL, NULL, NULL, NULL, 'A/B testing and analytics focus'),
(13, 'interview_scheduled', '2025-04-17 13:30:00', 'Initial Screen Scheduled', 'Recruiter and hiring manager screen', 1, 'video', 'https://linkedin.zoom.us/j/5555666677', 'pending', 'Team overview and culture fit');

-- Add missing applied events for jobs
INSERT INTO job_events (job_id, event_type, event_date, title, description, interview_round, interview_type, interview_link, interview_result, notes) VALUES
(4, 'applied', '2025-02-10 09:00:00', 'Applied to Netflix Data Scientist Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Strong background in ML required'),
(5, 'applied', '2025-02-20 09:00:00', 'Applied to Amazon Cloud Engineer Position', 'Submitted application through referral', NULL, NULL, NULL, NULL, 'Great team culture and benefits'),
(7, 'applied', '2025-03-10 09:00:00', 'Applied to Tesla Automotive Software Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Autonomous driving team'),
(8, 'applied', '2025-03-15 09:00:00', 'Applied to Spotify Backend Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Music streaming backend'),
(9, 'applied', '2025-03-20 09:00:00', 'Applied to Airbnb UX Designer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Portfolio review did not pass'),
(11, 'applied', '2025-04-01 09:00:00', 'Applied to Slack DevOps Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Infrastructure automation focus'),
(12, 'applied', '2025-04-05 09:00:00', 'Applied to Dropbox Security Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Cloud security specialist'),
(14, 'applied', '2025-04-15 09:00:00', 'Applied to Salesforce Cloud Solutions Architect Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Enterprise solutions focus'),
(15, 'applied', '2025-04-20 09:00:00', 'Applied to Adobe Creative Cloud Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Creative tools development'),
(16, 'applied', '2025-04-25 09:00:00', 'Applied to Zoom Video Platform Engineer Position', 'Submitted application online', NULL, NULL, NULL, NULL, 'Real-time video processing');

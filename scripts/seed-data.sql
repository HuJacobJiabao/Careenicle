-- Insert sample job data
INSERT INTO jobs (company, position, job_url, application_date, status, location, notes) VALUES
('Google', 'Senior Software Engineer', 'https://careers.google.com/jobs/123', '2024-01-15', 'interview', 'Mountain View, CA', 'Great company culture, tech stack matches my skills'),
('Microsoft', 'Frontend Developer', 'https://careers.microsoft.com/jobs/456', '2024-01-20', 'applied', 'Seattle, WA', 'Frontend position with React stack'),
('Apple', 'iOS Developer', 'https://jobs.apple.com/jobs/789', '2024-01-25', 'rejected', 'Cupertino, CA', 'Required more Swift experience'),
('Meta', 'Full Stack Engineer', 'https://www.metacareers.com/jobs/101112', '2024-02-01', 'offer', 'Menlo Park, CA', 'Received offer, considering options'),
('Amazon', 'Cloud Engineer', 'https://amazon.jobs/jobs/131415', '2024-02-05', 'applied', 'Austin, TX', 'AWS related position'),
('Netflix', 'Data Engineer', 'https://jobs.netflix.com/jobs/161718', '2024-02-10', 'interview', 'Los Gatos, CA', 'Exciting data challenges'),
('Spotify', 'Backend Engineer', 'https://www.lifeatspotify.com/jobs/192021', '2024-02-12', 'applied', 'New York, NY', 'Music streaming technology');

-- Insert sample interview data
INSERT INTO interviews (job_id, round, type, scheduled_date, interviewer, result, feedback, notes) VALUES
(1, 1, 'technical', '2024-01-22 14:00:00', 'John Smith', 'passed', 'Strong technical performance, solved algorithms correctly', 'Prepared common algorithm questions'),
(1, 2, 'hr', '2024-01-25 10:00:00', 'Sarah Johnson', 'pending', '', 'Waiting for HR interview results'),
(4, 1, 'phone', '2024-02-08 15:30:00', 'Mike Wilson', 'passed', 'Phone interview went well, interested in project experience', 'Highlighted React project experience'),
(4, 2, 'onsite', '2024-02-12 09:00:00', 'Tech Team', 'passed', 'Onsite interview passed, great team atmosphere', 'Coding exercise completed successfully'),
(6, 1, 'video', '2024-02-15 16:00:00', 'Emma Davis', 'passed', 'Video interview successful, discussed data architecture', 'Focused on big data experience'),
(6, 2, 'technical', '2024-12-20 10:00:00', 'Alex Chen', 'pending', '', 'Upcoming technical round');

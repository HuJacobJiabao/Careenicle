-- Job Tracker Database Cleanup Script
-- This script removes all tables and data from the job tracker database
-- WARNING: This will permanently delete all your job tracking data!

-- Display warning message
SELECT 'WARNING: This script will delete ALL job tracking data!' as warning_message;
SELECT 'Make sure you have backed up your data before proceeding!' as backup_reminder;

-- Drop triggers first (to avoid dependency issues)
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_job_events_updated_at ON job_events;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes (PostgreSQL will automatically drop them when tables are dropped, but being explicit)
DROP INDEX IF EXISTS idx_jobs_application_date;
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_jobs_company;
DROP INDEX IF EXISTS idx_jobs_position;
DROP INDEX IF EXISTS idx_jobs_favorite;
DROP INDEX IF EXISTS idx_job_events_job_id;
DROP INDEX IF EXISTS idx_job_events_event_type;
DROP INDEX IF EXISTS idx_job_events_event_date;

-- Drop tables in correct order (child tables first due to foreign key constraints)
DROP TABLE IF EXISTS job_events CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Verify cleanup
SELECT 'Database cleanup completed successfully!' as result;
SELECT 'All job tracking tables and data have been removed.' as confirmation;

-- Optional: Show remaining tables (should not include jobs or job_events)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

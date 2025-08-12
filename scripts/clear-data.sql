-- Job Tracker Database Data Cleanup Script
-- This script removes all data from tables but keeps the table structure intact
-- This is safer than dropping tables completely

-- Display warning message
SELECT 'WARNING: This script will delete ALL job tracking data but keep table structure!' as warning_message;
SELECT 'Make sure you have backed up your data before proceeding!' as backup_reminder;

-- Get count of records before deletion
SELECT 'Current data count:' as info;
SELECT 'Jobs: ' || COUNT(*) as job_count FROM jobs;
SELECT 'Job Events: ' || COUNT(*) as event_count FROM job_events;

-- Delete all data (order matters due to foreign key constraints)
-- Delete job_events first (child table)
DELETE FROM job_events;

-- Delete jobs (parent table)
DELETE FROM jobs;

-- Reset auto-increment sequences to start from 1
ALTER SEQUENCE jobs_id_seq RESTART WITH 1;
ALTER SEQUENCE job_events_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'Data cleanup completed successfully!' as result;
SELECT 'All job tracking data has been removed, but tables remain.' as confirmation;

-- Show final counts (should be 0)
SELECT 'Final data count:' as final_info;
SELECT 'Jobs: ' || COUNT(*) as final_job_count FROM jobs;
SELECT 'Job Events: ' || COUNT(*) as final_event_count FROM job_events;

-- Show that tables still exist
SELECT 'Remaining tables:' as table_info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('jobs', 'job_events')
ORDER BY table_name;

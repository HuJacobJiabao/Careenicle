-- Migration script to add user_id columns to existing Supabase tables
-- Run this SQL in your Supabase SQL Editor if you have existing data

-- Add user_id column to jobs table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.jobs 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- If you have existing data, you'll need to set user_id for existing records
        -- Replace 'YOUR_DEFAULT_USER_ID' with an actual user ID from auth.users
        -- UPDATE public.jobs SET user_id = 'YOUR_DEFAULT_USER_ID' WHERE user_id IS NULL;
        
        -- Make the column NOT NULL after setting values
        -- ALTER TABLE public.jobs ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Add user_id column to job_events table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_events' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.job_events 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- If you have existing data, you'll need to set user_id for existing records
        -- You can set it based on the job's user_id:
        -- UPDATE public.job_events SET user_id = (
        --     SELECT user_id FROM public.jobs WHERE jobs.id = job_events.job_id
        -- ) WHERE user_id IS NULL;
        
        -- Make the column NOT NULL after setting values
        -- ALTER TABLE public.job_events ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_date ON public.jobs(user_id, application_date);

CREATE INDEX IF NOT EXISTS idx_job_events_user_id ON public.job_events(user_id);
CREATE INDEX IF NOT EXISTS idx_job_events_user_date ON public.job_events(user_id, event_date);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.job_events;

-- Create user-specific policies
CREATE POLICY "Users can only access their own jobs" ON public.jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own job events" ON public.job_events
    FOR ALL USING (auth.uid() = user_id);

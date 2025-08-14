# Supabase Integration Setup

This document explains how to set up Supabase integration for the Job Tracker application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Setup Steps

### 1. Configure Environment Variables

In your `.env.local` file, add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To find these values:
1. Go to your Supabase project dashboard
2. Click on the "Settings" gear icon in the left sidebar
3. Click on "API" 
4. Copy the "Project URL" and "Project API Key (anon public)"

### 2. Create Database Tables

1. In your Supabase dashboard, go to the "SQL Editor"
2. Run the SQL script from `scripts/supabase-schema.sql`
3. This will create:
   - `jobs` table
   - `job_events` table
   - Necessary indexes
   - Row Level Security policies
   - Sample data (optional)

### 3. Switch to Supabase in the Application

The application supports three data sources:
- `postgresql` - Uses your local PostgreSQL database
- `supabase` - Uses Supabase cloud database

To switch to Supabase:
1. Open the application in your browser
2. Look for a data source switcher in the UI (typically in the header)
3. Select "Supabase" as your data source
4. The setting will be saved in localStorage

Alternatively, you can programmatically switch by calling:
```javascript
DataService.setDatabaseProvider("supabase")
```

## Database Schema

### Jobs Table
- `id` - Primary key
- `company` - Company name
- `position` - Job position
- `job_url` - URL to job posting
- `application_date` - Date of application
- `status` - Job status (applied, interview, rejected, offer, accepted)
- `location` - Job location
- `latitude/longitude` - Geographic coordinates
- `notes` - Additional notes
- `is_favorite` - Favorite flag
- `created_at/updated_at` - Timestamps

### Job Events Table
- `id` - Primary key
- `job_id` - Foreign key to jobs table
- `event_type` - Type of event (applied, interview, etc.)
- `event_date` - Date of event
- `title` - Event title
- `description` - Event description
- `interview_*` - Interview specific fields
- `notes` - Additional notes
- `metadata` - JSON metadata
- `created_at/updated_at` - Timestamps

## Authentication (Optional)

The current setup allows anonymous access for simplicity. To enable authentication:

1. Enable your preferred auth provider in Supabase Auth settings
2. Update the RLS policies in the SQL schema
3. Implement authentication in your React components

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**: Make sure to restart your development server after adding environment variables.

2. **RLS policies blocking access**: If you can't access data, check that the Row Level Security policies are correctly configured.

3. **Field mapping errors**: The application automatically converts between camelCase (JavaScript) and snake_case (PostgreSQL) field names.

### Development vs Production

- For development: You can use the anonymous access policies
- For production: Implement proper authentication and update RLS policies accordingly

## Testing the Integration

1. Switch to Supabase data source
2. Try creating a new job
3. Add job events to the job
4. Verify data appears in your Supabase dashboard

The application should seamlessly work with Supabase just like it does with mock data or PostgreSQL.

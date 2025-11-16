# AI Smart Paste Setup Guide

This guide will help you set up the AI Smart Paste feature that automatically extracts job information from pasted text.

## Prerequisites

You need a free Google Gemini API key to use this feature.

## Step 1: Get a Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key

**Note:** The free tier includes:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute
- **Completely free forever** - no credit card required
- **Commercial use allowed**

## Step 2: Add the API Key to Your Environment

1. Create a `.env.local` file in the root directory of the project (if it doesn't exist)
2. Add the following line:

```bash
GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the API key you copied from Google AI Studio.

## Step 3: Install Dependencies

If you haven't already installed the dependencies, run:

```bash
npm install
```

This will install the `@google/generative-ai` package along with other dependencies.

## Step 4: Restart the Development Server

If the server is already running, restart it:

```bash
npm run dev
```

## How to Use

1. Open the "Add Job" modal
2. You'll see an "AI Smart Paste" section at the top
3. Copy any job posting text from any website (LinkedIn, Indeed, company careers page, etc.)
4. Paste it into the text area
5. Click "Parse with AI"
6. The AI will automatically extract and fill in:
   - Company name
   - Position title
   - Location
   - Salary (if mentioned)
   - Job description

## Example

Try pasting something like:

```
Google is hiring a Senior Software Engineer in Mountain View, CA.
We're looking for someone with 5+ years of experience in backend development.
Salary range: $150,000 - $200,000
Apply now at https://careers.google.com/jobs/123
```

The AI will automatically extract:
- **Company:** Google
- **Position:** Senior Software Engineer
- **Location:** Mountain View, CA
- **Notes:** Salary: $150,000 - $200,000 (plus the description)

## Troubleshooting

### "Gemini API key not configured" error

Make sure:
1. You've created a `.env.local` file in the root directory
2. The file contains `GEMINI_API_KEY=your_actual_key`
3. You've restarted the development server after adding the key

### API rate limits

The free tier allows 1,500 requests per day. For a personal job tracking app, this is more than enough. If you somehow exceed this limit:
- Wait until the next day (limits reset at midnight Pacific Time)
- Or upgrade to a paid plan (though this is unlikely to be necessary)

### Parsing doesn't work well

The AI is quite good at extracting information, but if the job posting text is very messy or doesn't contain clear information:
- Try pasting a cleaner version of the text
- Or just fill in the fields manually

## Cost

**This feature is completely free!** The Google Gemini API free tier is generous and perfect for personal projects like this.

Estimated usage:
- Each parsing request costs approximately $0.0005 (1/20th of a cent)
- Even if you parse 100 jobs per day, it's still **FREE** under the free tier limits

## Privacy

- Your job posting text is sent to Google's Gemini API for processing
- Google may use this data to improve their services (check their privacy policy)
- If you're concerned about privacy, you can choose not to use this feature and fill in the form manually

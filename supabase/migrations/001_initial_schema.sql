-- Facebook Ad Manager Database Schema
-- Run this in your Supabase SQL Editor

-- Create scraping jobs tracking table
CREATE TABLE scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scraping', 'downloading', 'completed', 'failed')),
  total_ads INTEGER DEFAULT 0,
  scraped_ads INTEGER DEFAULT 0,
  downloaded_ads INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create main ads table
CREATE TABLE ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_archive_id TEXT UNIQUE NOT NULL,
  ad_url TEXT,
  is_active BOOLEAN DEFAULT true,
  page_name TEXT,
  
  -- Original URLs from n8n scraping
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  preview_image_url TEXT, -- From n8n (for videos only, null for images)
  
  -- Local media after download
  local_media_url TEXT, -- Main media file in Supabase Storage
  local_thumbnail_url TEXT, -- Thumbnail (downloaded preview_image for videos, same as local_media_url for images)
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed')),
  download_error TEXT,
  
  -- Ad metadata
  caption TEXT,
  cta TEXT,
  title TEXT,
  description TEXT,
  start_date INTEGER,
  start_date_formatted TEXT,
  end_date INTEGER,
  end_date_formatted TEXT,
  duration_days INTEGER,
  
  -- Job tracking
  job_id UUID REFERENCES scraping_jobs(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ads_download_status ON ads(download_status);
CREATE INDEX idx_ads_media_type ON ads(media_type);
CREATE INDEX idx_ads_job_id ON ads(job_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);

-- Enable real-time subscriptions
ALTER TABLE ads REPLICA IDENTITY FULL;
ALTER TABLE scraping_jobs REPLICA IDENTITY FULL;

-- Enable Row Level Security (RLS) for security
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations for scraping_jobs" ON scraping_jobs
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for ads" ON ads
FOR ALL USING (true) WITH CHECK (true);
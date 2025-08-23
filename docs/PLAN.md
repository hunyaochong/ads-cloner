# Facebook Ad Manager Application - Implementation Plan

## Overview

A comprehensive web application for scraping Facebook Ad Library data, downloading media files locally, and managing ad content with advanced filtering and preview capabilities.

## Architecture

- **Frontend**: React + TypeScript
- **Backend**: Node.js/Express API
- **Database**: Supabase PostgreSQL + Storage
- **Scraping**: n8n workflow integration
- **Media Downloads**: Python ad_media_downloader.py

## Database Schema

### Supabase Tables

```sql
-- Scraping jobs tracking
CREATE TABLE scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'scraping', 'downloading', 'completed', 'failed'
  total_ads INTEGER DEFAULT 0,
  scraped_ads INTEGER DEFAULT 0,
  downloaded_ads INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Main ads table
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
  download_status TEXT DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed'
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

-- Indexes for performance
CREATE INDEX idx_ads_download_status ON ads(download_status);
CREATE INDEX idx_ads_media_type ON ads(media_type);
CREATE INDEX idx_ads_job_id ON ads(job_id);

-- Enable real-time subscriptions
ALTER TABLE ads REPLICA IDENTITY FULL;
ALTER TABLE scraping_jobs REPLICA IDENTITY FULL;
```

### Supabase Storage Structure

```
/ad-media/
  /{job_id}/
    /media/
      - {ad_archive_id}.mp4 (videos)
      - {ad_archive_id}.jpg (images)
    /thumbnails/
      - {ad_archive_id}_thumb.jpg (video preview images only)
```

## Data Flow

1. **User Input**: Enter Meta Ad Library URL
2. **Job Creation**: Frontend creates `scraping_jobs` record → gets `job_id` (status: `"pending"`)
3. **n8n Trigger**: Backend calls n8n webhook with `job_id` and URL
4. **Webhook Response**: n8n returns 200 immediately → Backend updates job status to `"scraping"`
5. **Async Scraping**: n8n scrapes Meta Ad Library, inserts ads directly to Supabase with `job_id`
6. **Auto-Download Trigger**: When first ad appears → Frontend updates job to `"downloading"` and calls download API
7. **Parallel Processing**: Media downloads happen in background while more ads are being scraped
8. **Real-time Updates**: Frontend shows ads appearing and thumbnails loading as downloads complete
9. **Completion**: All ads scraped and downloads finished → Job status `"completed"` or `"failed"`

### Job Status Flow
- **`"pending"`** → Job created, webhook about to be called
- **`"scraping"`** → n8n webhook returned 200, scraping in progress
- **`"downloading"`** → First ad appeared, media downloads started
- **`"completed"`** → All processing finished successfully
- **`"failed"`** → Error at any stage

## Key Features

### Core Functionality
- **URL Import**: Paste Meta Ad Library URL, click "Populate"
- **Real-time Table**: Shows ads immediately with progressive thumbnail loading
- **Media Type Filter**: All / Video Only / Image Only buttons
- **Preview Modal**: Click thumbnail to view full media with Facebook-style UI
- **Bulk Selection**: Checkboxes for selecting multiple ads
- **Clone Feature**: 1:1 duplication of selected ads

### Technical Features
- **Progressive Loading**: Skeleton table → data appears → thumbnails load
- **Real-time Subscriptions**: Live updates as downloads complete
- **Error Handling**: Failed downloads shown with retry options
- **Local Storage**: All media stored in Supabase for reliability

## n8n Workflow Integration

### Workflow ID
`8xTPT55gwzaepe62`

### Webhook Configuration
- **Input**: `{ "job_id": "uuid", "url": "meta_ad_library_url" }`
- **Process**: Extract URL → Run Apify scraper → Add job_id to each ad
- **Output**: Array of ads with job_id attached

### n8n Node Flow
```
Webhook (POST: receives job_id + url) → Return 200 immediately
    ↓ (async continuation)
Set Meta Ad URL (extract job_id and url)
    ↓
Run Meta Ad Library Scraper (scrape using url)
    ↓
Get dataset items (retrieve scraped ads)
    ↓
Extract relevant attributes (process ad data)
    ↓
Edit Fields (add job_id to each ad record)
    ↓
Insert Ads to Supabase (with job_id, triggers real-time subscriptions)
```

### Auto-Download Trigger Logic
- **Frontend Real-time Hook**: Monitors ads table for job_id
- **First Ad Detection**: When `ads.length > 0` and `job.status === 'scraping'`
- **Automatic Actions**: 
  1. Update job status to `"downloading"`
  2. Call `/api/download-job-media/{jobId}`
  3. Show progress indicators
- **Parallel Processing**: Downloads start while scraping continues

## Implementation Phases

### Phase 1: Foundation & Database Setup
**Duration**: 1-2 days

**Frontend**:
- [ ] Initialize React + TypeScript project with strict mode
- [ ] Install dependencies with exact versions (Supabase, TanStack Table, shadcn/ui, etc.)
- [ ] Lock Tailwind CSS to version 3.4.17 (no ^ ranges)
- [ ] Set up project structure and routing
- [ ] Configure environment variables

**Backend**:
- [ ] Create Node.js/Express server
- [ ] Set up Supabase client connection
- [ ] Create database schema and tables
- [ ] Configure Supabase Storage bucket 'ad-media'
- [ ] Set up real-time subscriptions

**Python**:
- [ ] Modify `ad_media_downloader.py` for single file downloads
- [ ] Create `download_single.py` script for backend integration
- [ ] Test download functionality

**n8n**:
- [ ] Configure webhook to accept job_id and url
- [ ] Test basic data flow from webhook to response

### Phase 2: Core Scraping & Data Flow
**Duration**: 2-3 days

**Status**: 🔄 **Step 1 COMPLETE** - URL input interface functional, Step 2 next

**Frontend**:
- [x] Build `AdLibraryImporter` component ✅
- [x] Implement job creation in Supabase ✅
- [x] Set up n8n webhook integration ✅
- [ ] Create basic ads table structure (Step 3)
- [x] Implement real-time subscription hooks ✅

**n8n**:
- [ ] Update workflow to handle job_id properly
- [ ] Configure "Edit Fields" node to add job_id to each ad
- [ ] Implement retry logic for webhook calls with exponential backoff
- [ ] Test end-to-end scraping with job tracking
- [ ] Ensure proper error handling

**Backend**:
- [x] Create `/api/download-media` endpoint ✅
- [x] Implement media download processing with retry logic [0ms, 2s, 8s, 30s] ✅
- [x] Set up file upload to Supabase Storage ✅
- [x] Add progress tracking and status updates ✅
- [x] Implement clear error messages with actionable retry options ✅

### Phase 3: UI Components & Table Features
**Duration**: 2-3 days

**Frontend**:
- [ ] Build main `AdLibraryTable` component with TanStack Table
- [ ] Implement skeleton loading states
- [ ] Create thumbnail display with loading/error states
- [ ] Add media type filter (All/Video/Image buttons)
- [ ] Implement sorting and basic table controls
- [ ] Add responsive design for mobile/tablet
- [ ] Set up bundle size monitoring (target <500KB total)
- [ ] Implement basic performance tracking

**Components**:
- [ ] `ThumbnailCell` with click handlers
- [ ] `MediaTypeFilter` with state management
- [ ] `SkeletonRow` for loading states
- [ ] `ProgressIndicator` for download status

### Phase 4: Preview Modal & Media Display
**Duration**: 1-2 days

**Frontend**:
- [ ] Create `AdPreviewModal` component with code splitting/lazy loading
- [ ] Implement Facebook-style post preview UI
- [ ] Add video player with controls
- [ ] Create image display with zoom
- [ ] Add modal navigation (ESC to close, click outside)
- [ ] Implement memory cleanup for media blobs after modal close
- [ ] Style modal to match design mockup

**Features**:
- [ ] Full-size media display
- [ ] Page name and metadata display
- [ ] CTA button styling
- [ ] Like/Comment/Share UI (visual only)

### Phase 5: Advanced Features & Clone Functionality
**Duration**: 1-2 days

**Frontend**:
- [ ] Implement multi-select checkboxes
- [ ] Create `ClonePanel` component
- [ ] Add bulk clone functionality
- [ ] Implement 1:1 ad duplication
- [ ] Add success/error toast notifications
- [ ] Create clone confirmation dialog

**Backend**:
- [ ] Add clone endpoint for bulk operations
- [ ] Implement proper ad duplication logic
- [ ] Handle cloned media file references

### Phase 6: Error Handling & Polish
**Duration**: 1-2 days

**System-wide**:
- [ ] Implement comprehensive error handling
- [ ] Add retry logic for failed downloads
- [ ] Create error boundaries in React
- [ ] Add loading states and progress indicators
- [ ] Implement proper logging and monitoring

**UX Improvements**:
- [ ] Add keyboard shortcuts (ESC, space, arrows)
- [ ] Implement smooth animations and transitions
- [ ] Add drag-and-drop for URL input
- [ ] Create help tooltips and user guidance

### Phase 7: Testing & Deployment
**Duration**: 1-2 days

**Testing**:
- [ ] Test with various Meta Ad Library URLs
- [ ] Test different media types and sizes
- [ ] Test real-time updates and concurrent users
- [ ] Test error scenarios and recovery
- [ ] Performance testing with large datasets

**Deployment**:
- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Deploy backend API
- [ ] Deploy frontend application
- [ ] Set up monitoring and alerts

## File Structure

```
ads-downloader/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdLibraryTable.tsx
│   │   │   ├── AdPreviewModal.tsx
│   │   │   ├── AdLibraryImporter.tsx
│   │   │   ├── MediaTypeFilter.tsx
│   │   │   ├── ClonePanel.tsx
│   │   │   ├── ThumbnailCell.tsx
│   │   │   ├── SkeletonRow.tsx
│   │   │   └── ui/ (shadcn components)
│   │   ├── hooks/
│   │   │   ├── useRealtimeAds.ts
│   │   │   ├── useScrapingJob.ts
│   │   │   ├── useMediaFilter.ts
│   │   │   └── useAdSelection.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── utils.ts
│   │   │   └── types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── server.js
│   ├── services/
│   │   └── mediaDownloader.js
│   ├── package.json
│   └── .env
├── python/
│   ├── ad_media_downloader.py (existing)
│   └── download_single.py (new)
├── docs/
│   ├── PLAN.md (this file)
│   └── API.md
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

## Technical Specifications

### Dependencies

**Frontend** (exact versions to prevent breaking changes):
```json
{
  "@supabase/supabase-js": "2.39.7",
  "@tanstack/react-table": "8.10.7",
  "react": "18.2.0",
  "typescript": "5.1.6",
  "tailwindcss": "3.4.17",
  "shadcn/ui": "latest",
  "lucide-react": "latest",
  "framer-motion": "10.16.4",
  "react-hot-toast": "2.4.1"
}
```

**Backend**:
```json
{
  "express": "^4.x",
  "@supabase/supabase-js": "^2.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

### Environment Variables

**Frontend** (`.env`):
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

**Backend** (`.env`):
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
```

## Success Criteria

### Phase 1 Success ✅ COMPLETED
- [x] Database schema created and tested ✅
- [x] Supabase Storage configured ✅
- [x] Basic project structure set up with TypeScript strict mode ✅
- [x] Dependencies locked to exact versions (Tailwind 3.4.17) ✅
- [x] Python downloader tested ✅

### Phase 2 Success
**Step 1 Complete ✅**: URL input interface with job creation
- [x] Frontend can create jobs in Supabase ✅
- [x] Backend can download and store media files with error recovery ✅
- [x] Real-time updates working ✅
- [x] Clear error messages displayed with retry options ✅
- [ ] n8n workflow returns data with job_id (user configured)
- [ ] Complete ads table with skeleton → data progression (Step 2-3)
- [ ] Full URL → table display flow working

### Phase 3 Success
- [ ] Table displays ads with loading states
- [ ] Media type filter working
- [ ] Responsive design implemented for mobile/tablet
- [ ] Bundle size monitoring active (<500KB target)
- [ ] Thumbnails display properly

### Phase 4 Success
- [ ] Preview modal opens and displays media (code-split/lazy loaded)
- [ ] Video player and image zoom working
- [ ] Facebook-style UI matches design
- [ ] Modal interactions smooth
- [ ] Memory cleanup implemented for media files
- [ ] No memory leaks detected in browser dev tools

### Phase 5 Success
- [ ] Multi-select and clone functionality working
- [ ] Bulk operations complete successfully
- [ ] Toast notifications provide feedback
- [ ] Cloned ads appear in table

### Phase 6 Success
- [ ] Error handling covers edge cases
- [ ] Performance optimized for large datasets
- [ ] User experience polished and intuitive
- [ ] System robust under load

### Phase 7 Success
- [ ] Application deployed and accessible
- [ ] All features tested in production
- [ ] Monitoring and alerts configured
- [ ] Documentation complete

## Risk Mitigation

### Technical Risks
- **Facebook URL changes**: Monitor and update n8n workflow as needed
- **Download failures**: Implement retry logic and error recovery
- **Storage limits**: Monitor usage and implement cleanup strategies
- **Real-time performance**: Optimize subscriptions and limit concurrent connections

### User Experience Risks
- **Slow downloads**: Provide clear progress indicators and estimated times
- **Large datasets**: Implement pagination and virtualization
- **Mobile experience**: Ensure responsive design works on all devices
- **Error states**: Provide clear messaging and recovery options

## Lessons from Previous Project

*Based on analysis of CLAUDE-troubleshooting.md and resolved-issues.md from a previous PDF OCR project*

### **HIGHLY RELEVANT** (Must Apply)

#### **1. Dependency Management (Critical)**
**Issue**: Previous project became completely unusable due to Tailwind v4 automatic upgrade
**Integration**: 
- Lock Tailwind to exact version: `"tailwindcss": "3.4.17"` (no ^ ranges)
- Lock all critical dependencies to exact versions in package.json
- Test major version upgrades in separate branches before applying

#### **2. Network Retry Logic (Important)**
**Issue**: Network failures and API timeouts caused user frustration
**Integration**:
- Implement exponential backoff for media downloads: [0ms, 2s, 8s, 30s]
- Add retry logic for n8n webhook calls
- Provide clear error messages with retry options

#### **3. Bundle Size Management (Important)**
**Issue**: Previous project hit 890KB, causing slow load times
**Integration**:
- Monitor bundle size, target <500KB total
- Use code splitting for preview modal components
- Implement dynamic imports for non-critical features

### **SOMEWHAT RELEVANT** (Consider Later)

#### **4. Memory Management**
**Relevance**: We'll load media files, but less intensive than PDF processing
**Integration**: Implement cleanup for media blobs after upload to Supabase

#### **5. Mobile Responsiveness**
**Relevance**: Table + modal design needs mobile consideration
**Integration**: Basic responsive design in Phase 3, not extensive optimization

### **NOT RELEVANT** (Skip)

- **OCR-Specific Patterns**: 60% of troubleshooting was OCR processing - not applicable
- **PDF Display Issues**: PDF rendering problems don't apply to images/videos
- **Complex Text Search**: We have simple filtering, not regex search with highlighting
- **File Upload Complexity**: We use URLs, not drag-drop file uploads
- **Complex Error Recovery**: Previous project needed extensive retry because OCR was expensive/slow

### **Realistic Integration Actions**

**Phase 1**: Lock Tailwind to v3.4.17, set up TypeScript strict mode
**Phase 2**: Add retry logic for n8n webhook and media downloads  
**Phase 3**: Bundle size monitoring, mobile-responsive table
**Phase 4**: Memory cleanup for media files in modal

*Everything else: Skip unless we encounter specific problems during development*

---

This plan provides a comprehensive roadmap for building the Facebook Ad Manager application with clear phases, deliverables, and success criteria.
# Phase 2: Core Scraping & Data Flow

## Overview

Building the functional Facebook Ad Manager interface with URL input, job creation, and real-time ads display following the progressive loading pattern: Skeleton → Data → Thumbnails.

**Step 1 Status**: ✅ COMPLETED - URL input interface is now functional

## Implementation Steps

### Step 1: Core URL Input Interface ✅ COMPLETED
- [x] Create `AdLibraryImporter.tsx` component ✅
- [x] Implement Meta Ad Library URL validation ✅
- [x] Add job creation flow (Frontend → Backend API → Supabase) ✅
- [x] Build success/error feedback UI ✅
- [x] Update App.tsx to use AdLibraryImporter ✅

### Step 2: Status-Based Progress Tracking with Auto-Download
- [ ] Create `JobProgress.tsx` with status-based progress indicators
- [ ] Implement 5-state progression: pending → scraping → downloading → completed/failed
- [ ] Use existing `useScrapingJob` hook for real-time job status updates
- [ ] Add auto-download trigger when first ad appears in `useRealtimeAds`
- [ ] Show clear status messages: "Creating job..." → "Scraping ads..." → "Downloading media..."

### Step 3: Basic Ads Table Structure
- [ ] Build `AdLibraryTable.tsx` with skeleton rows initially
- [ ] Use existing `useRealtimeAds` hook for live data
- [ ] Create simple table layout (text only, no thumbnails)
- [ ] Add `SkeletonRow` components while loading

### Step 4: Webhook Integration & Data Flow ✅ COMPLETED
- [x] Connect backend job creation to n8n webhook ✅
- [x] Implement POST webhook with immediate 200 response ✅
- [x] Add comprehensive error handling with status updates ✅
- [x] Test complete flow: URL → Backend → n8n webhook trigger ✅

### Step 5: Auto-Download Integration & Real-Time Data
- [ ] Implement auto-download trigger logic in `useRealtimeAds`
- [ ] Add job status transition: scraping → downloading when first ad appears
- [ ] Connect to existing `/api/download-job-media/{jobId}` endpoint
- [ ] Display real-time ad data with download progress indicators
- [ ] Prepare table foundation for Phase 3 thumbnail enhancements

## Technical Architecture

### Components Structure
```
src/components/
├── AdLibraryImporter.tsx    # URL input & job creation
├── JobProgress.tsx          # Skeleton → real-time job status  
├── AdLibraryTable.tsx       # Basic ads display
├── SkeletonStates.tsx       # Skeleton components for loading
└── ui/                      # shadcn components
```

### Progressive Loading Pattern (Per PLAN.md)
1. **Skeleton Table** - Immediate visual feedback
2. **Data Appears** - Real ad information populates rows  
3. **Thumbnails Load** - (Phase 3 feature, not Phase 2)

### API Integration Flow
- Frontend creates job → Backend calls n8n webhook → Job status "scraping"
- n8n scrapes → Inserts ads to Supabase → Real-time subscriptions trigger
- First ad appears → Auto-trigger downloads → Job status "downloading"
- Media downloads process → Thumbnails appear → Job status "completed"

### Auto-Download Logic Implementation
```javascript
// In useRealtimeAds hook:
useEffect(() => {
  if (ads.length > 0 && job.status === 'scraping') {
    updateJobStatus(job.id, 'downloading');
    fetch(`/api/download-job-media/${job.id}`, { method: 'POST' });
  }
}, [ads.length, job.status]);
```

### User Experience Flow
1. User enters Meta Ad Library URL
2. System validates URL and shows skeleton progress indicator
3. Job created and n8n webhook triggered
4. Skeleton ads table appears immediately
5. Real scraped data replaces skeleton rows as it arrives
6. Background media downloads begin (thumbnails in Phase 3)

## Phase 2 Progress Summary

**Current Status: Step 1 Complete, Step 2 Next**

### ✅ Step 1 Completed (Infrastructure & URL Input)
- [x] `AdLibraryImporter` component with Meta URL validation ✅
- [x] Job creation API integration working ✅
- [x] Success/error feedback UI ✅
- [x] App.tsx refactored from status page to functional interface ✅
- [x] Environment validation with graceful fallbacks ✅

### 🔄 Next: Step 2 (Skeleton Progress Tracking)
- [ ] Create `JobProgress.tsx` with skeleton loading states
- [ ] Implement progressive skeleton → real data transitions
- [ ] Add real-time job status updates using existing hooks

### Frontend Tasks Status
- [x] Build `AdLibraryImporter` component ✅
- [x] Implement job creation in Supabase ✅
- [x] Set up n8n webhook integration ✅
- [ ] Create basic ads table structure (Step 3)
- [x] Implement real-time subscription hooks ✅

### Backend Tasks (Already Complete from Phase 1)
- [x] Create `/api/download-media` endpoint ✅
- [x] Implement media download processing with retry logic ✅
- [x] Set up file upload to Supabase Storage ✅
- [x] Add progress tracking and status updates ✅

### n8n Tasks (Complete from Phase 1)
- [x] Update workflow to handle job_id properly ✅
- [x] Configure "Edit Fields" node to add job_id to each ad ✅
- [x] Implement retry logic for webhook calls ✅
- [x] Test end-to-end scraping with job tracking ✅
- [x] Ensure proper error handling ✅

## Success Criteria

### Step 1 Success ✅ COMPLETED
- [x] Functional URL input with Meta Ad Library validation ✅
- [x] Job creation API integration working ✅
- [x] Success/error feedback displayed to user ✅
- [x] Clean UI replacing status page ✅

### Step 2 Success  
- [ ] Skeleton loading states showing immediately
- [ ] Real-time job progress updates working
- [ ] Smooth skeleton → data transitions

### Step 3 Success
- [ ] Basic ads table displaying scraped data
- [ ] Real-time subscription showing new ads as they arrive
- [ ] Table responsive and performant

### Overall Phase 2 Success
- [ ] Complete flow from URL input to ads display working
- [ ] Progressive loading pattern implemented
- [ ] Real-time updates functioning
- [ ] Error handling robust
- [ ] Ready for Phase 3 thumbnail enhancements

## Next Phase Preview

**Phase 3** will add:
- Thumbnail display with loading states
- Media type filtering (All/Video/Image)
- Enhanced table features and sorting
- Performance optimizations
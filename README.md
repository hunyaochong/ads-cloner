# Facebook Ad Manager Application

A comprehensive web application for scraping Facebook Ad Library data, downloading media files locally, and managing ad content with advanced filtering and preview capabilities.

## Phase 1 Status: BACKEND & FRONTEND FOUNDATION COMPLETE ✅

### Architecture Overview
- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js/Express API
- **Database**: Supabase PostgreSQL + Storage
- **Scraping**: n8n workflow integration
- **Media Downloads**: Python ad_media_downloader.py

## Quick Start

### Prerequisites
- Node.js 20+ 
- Python 3.8+
- Supabase account
- n8n instance

### 1. Database Setup
Run the SQL migration in Supabase dashboard:
```bash
# Copy and paste the contents of supabase/migrations/001_initial_schema.sql
# into your Supabase SQL Editor
```

### 2. Environment Configuration

**Frontend (.env)**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
VITE_API_BASE_URL=http://localhost:3001
```

**Backend (.env)**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
PYTHON_SCRIPT_PATH=../ad_media_downloader.py
```

### 3. Installation & Run

**Frontend**:
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Backend**:
```bash
cd backend
npm install
npm run dev  # http://localhost:3001
```

### 4. API Endpoints

- `GET /health` - Health check
- `GET /api/test-db` - Database connection test
- `POST /api/scraping-jobs` - Create scraping job
- `GET /api/scraping-jobs/:id` - Get job details
- `GET /api/ads?job_id=:id` - Get ads for job
- `POST /api/download-media` - Download media files
- `POST /api/download-job-media/:jobId` - Download all job media
- `GET /api/download-status` - Get download queue status

### 5. Python Downloader

Test single file download:
```bash
python3 ad_media_downloader.py --single-url "https://example.com/image.jpg" --filename "test.jpg" --media-type image
```

## Project Structure

```
ads-downloader/
├── frontend/                # React + TypeScript app
│   ├── src/
│   │   ├── components/ui/  # shadcn components
│   │   ├── hooks/          # React hooks (real-time)
│   │   ├── lib/            # Utils, types, Supabase client
│   │   └── App.tsx
│   └── package.json        # Locked dependencies
├── backend/                # Node.js API server
│   ├── services/          # Storage & download services
│   ├── server.js          # Main server file
│   └── package.json
├── supabase/              # Database migrations
│   └── migrations/
├── docs/                  # Documentation
│   ├── PLAN.md           # Complete implementation plan
│   └── PHASE_1.md        # Phase 1 progress
└── ad_media_downloader.py # Enhanced Python downloader
```

## Key Features Implemented

### ✅ Phase 1 Complete
- React + TypeScript foundation with exact dependency versions
- Tailwind CSS 3.4.17 (locked to prevent v4 upgrade issues)
- Express API with comprehensive endpoints
- Supabase integration with typed client
- Real-time subscriptions for live updates
- Python script with single-file download support
- Media downloader service with queue processing
- Storage service for Supabase Storage integration

### 📋 Next: Phase 2 (UI Components & Table)
- AdLibraryImporter component
- Real-time ads table with TanStack Table
- Media type filtering
- Thumbnail display with loading states
- Progressive loading UX

## Development Notes

- **Strict TypeScript**: All code uses strict mode for better reliability
- **Dependency Locking**: Tailwind locked to 3.4.17 to prevent breaking changes
- **Real-time Updates**: Live subscriptions show download progress
- **Error Handling**: Comprehensive error handling with retry logic
- **Modular Architecture**: Clean separation between services

## Testing

Backend health check:
```bash
curl http://localhost:3001/health
```

Database connection test:
```bash
curl http://localhost:3001/api/test-db
```

---

*Phase 1 Foundation Complete! Ready for Phase 2 UI development or n8n integration.*
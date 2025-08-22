# CLAUDE-config-variables.md

## Configuration Variables Reference

### Environment Variables

#### Frontend (.env)
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Workflow Integration
REACT_APP_N8N_WEBHOOK_URL=your_n8n_webhook_url

# Optional: Development Settings
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

#### Backend (.env)
```bash
# Supabase Configuration (Service Key for backend operations)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Python Script Path
PYTHON_DOWNLOADER_PATH=../python/download_single.py

# Media Storage Configuration
MAX_FILE_SIZE_MB=50
STORAGE_BUCKET=ad-media
```

#### Python Media Downloader (.env or script configuration)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Download Configuration
DOWNLOAD_TIMEOUT=30
MAX_RETRIES=3
CHUNK_SIZE=8192
```

---

### Application Configuration

#### Retry Logic Configuration
```typescript
// Media Download Retry Settings
const RETRY_CONFIG = {
  maxAttempts: 4,
  delays: [0, 2000, 8000, 30000], // immediate, 2s, 8s, 30s
  shouldRetry: (error: any) => error.status !== 404 && error.status !== 403
};

// n8n Webhook Retry Settings
const WEBHOOK_RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [0, 1000, 5000], // immediate, 1s, 5s
  timeout: 30000 // 30 seconds
};
```

#### Bundle Size Targets
```typescript
const PERFORMANCE_TARGETS = {
  bundleSize: {
    total: 500, // KB
    js: 450,    // KB
    css: 50     // KB
  },
  loadTime: {
    target: 2000,   // ms
    maximum: 5000   // ms
  }
};
```

#### Table Performance Limits
```typescript
const TABLE_CONFIG = {
  virtualizationThreshold: 100, // Enable virtualization after 100 ads
  maxAdsPerPage: 50,            // Pagination limit
  thumbnailSize: {
    width: 150,  // px
    height: 150  // px
  },
  skeletonRows: 10              // Loading skeleton count
};
```

---

### Database Configuration

#### Supabase Table Schema Versions
```sql
-- Current schema version: 1.0
-- Last updated: 2025-08-22

-- Enable real-time for tables
ALTER TABLE ads REPLICA IDENTITY FULL;
ALTER TABLE scraping_jobs REPLICA IDENTITY FULL;

-- Storage bucket configuration
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-media', 'ad-media', true);
```

#### Storage Structure Configuration
```typescript
const STORAGE_CONFIG = {
  bucket: 'ad-media',
  paths: {
    media: (jobId: string, adId: string, ext: string) => 
      `${jobId}/media/${adId}.${ext}`,
    thumbnails: (jobId: string, adId: string) => 
      `${jobId}/thumbnails/${adId}_thumb.jpg`
  },
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
};
```

---

### n8n Workflow Configuration

#### Workflow Details
```javascript
// Workflow ID: 8xTPT55gwzaepe62
// Webhook URL: [configured in environment]

// Webhook Input Schema
{
  "job_id": "uuid",
  "url": "string" // Meta Ad Library URL
}

// Expected Output Schema
{
  "ads": [
    {
      "ad_archive_id": "string",
      "ad_url": "string",
      "media_url": "string",
      "media_type": "image|video",
      "preview_image_url": "string|null",
      "page_name": "string",
      "caption": "string",
      "cta": "string",
      "job_id": "uuid" // Added by Edit Fields node
    }
  ]
}
```

#### n8n Node Configuration
```javascript
// Edit Fields Node Configuration
return items.map(item => ({
  ...item.json,
  job_id: $('Webhook').first().json.body.job_id
}));

// Error Handling Node
if (error) {
  return [{
    json: {
      error: true,
      message: error.message,
      job_id: $('Webhook').first().json.body.job_id
    }
  }];
}
```

---

### Component Configuration

#### Real-time Subscription Settings
```typescript
const REALTIME_CONFIG = {
  channelName: 'ads_changes',
  events: ['INSERT', 'UPDATE', 'DELETE'],
  schema: 'public',
  table: 'ads',
  reconnectDelay: 1000, // ms
  maxReconnectAttempts: 10
};
```

#### Modal Configuration
```typescript
const MODAL_CONFIG = {
  animation: {
    duration: 200, // ms
    easing: 'ease-out'
  },
  lazy: true,           // Code splitting enabled
  backdrop: {
    blur: true,
    opacity: 0.8
  },
  keyboard: {
    escapeKey: true,    // ESC to close
    arrowKeys: true     // Navigate between ads
  }
};
```

#### Filter Configuration
```typescript
const FILTER_CONFIG = {
  mediaTypes: ['all', 'video', 'image'] as const,
  defaultFilter: 'all',
  persistence: true, // Remember filter in localStorage
  debounceMs: 300   // Search input debounce
};
```

---

### Development Configuration

#### Package.json Dependencies (Exact Versions)
```json
{
  "@supabase/supabase-js": "2.39.7",
  "@tanstack/react-table": "8.10.7",
  "react": "18.2.0",
  "typescript": "5.1.6",
  "tailwindcss": "3.4.17",
  "framer-motion": "10.16.4",
  "react-hot-toast": "2.4.1"
}
```

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: []
};
```

---

### Monitoring and Logging Configuration

#### Console Logging Levels
```typescript
const LOG_CONFIG = {
  development: {
    level: 'debug',
    enableNetworkLogs: true,
    enablePerformanceLogs: true
  },
  production: {
    level: 'error',
    enableNetworkLogs: false,
    enablePerformanceLogs: false
  }
};
```

#### Performance Monitoring
```typescript
const PERFORMANCE_CONFIG = {
  metrics: {
    tableRender: true,
    mediaLoad: true,
    apiCalls: true
  },
  thresholds: {
    tableRender: 100,    // ms
    mediaLoad: 2000,     // ms
    apiCall: 5000        // ms
  }
};
```

#### Error Boundary Configuration
```typescript
const ERROR_BOUNDARY_CONFIG = {
  fallbackComponent: 'ErrorFallback',
  logErrors: true,
  reportErrors: false, // Set to true in production with error service
  resetOnPropsChange: true
};
```

---

### Security Configuration

#### CORS Settings (Backend)
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-production-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### Supabase Row Level Security
```sql
-- Enable RLS on tables
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Basic read policy (adjust based on auth requirements)
CREATE POLICY "Allow public read" ON ads
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON scraping_jobs
  FOR SELECT USING (true);
```

#### Content Security Policy
```typescript
const CSP_CONFIG = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-eval'"], // React dev mode
  styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind
  imgSrc: ["'self'", "data:", "https:"],   // Thumbnails
  mediaSrc: ["'self'", "blob:", "https:"], // Video playback
  connectSrc: ["'self'", "wss:", "https:"] // Supabase + n8n
};
```

---

### Testing Configuration

#### Test Environment Variables
```bash
# .env.test
REACT_APP_SUPABASE_URL=test_supabase_url
REACT_APP_SUPABASE_ANON_KEY=test_anon_key
REACT_APP_N8N_WEBHOOK_URL=mock_webhook_url
```

#### Mock Configuration
```typescript
const MOCK_CONFIG = {
  enableMocks: process.env.NODE_ENV === 'test',
  mockData: {
    ads: 10,              // Generate 10 mock ads
    jobDuration: 5000,    // Mock job takes 5 seconds
    downloadDelay: 1000   // Mock download delay
  }
};
```

---

### Deployment Configuration

#### Production Environment
```bash
# Production .env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key
REACT_APP_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
REACT_APP_ENV=production
```

#### Build Configuration
```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
  }
}
```

#### Health Check Configuration
```typescript
const HEALTH_CHECK_CONFIG = {
  endpoints: {
    database: '/health/db',
    storage: '/health/storage', 
    n8n: '/health/n8n'
  },
  timeout: 5000,  // ms
  interval: 30000 // ms
};
```
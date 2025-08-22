# CLAUDE-troubleshooting.md

## Common Issues and Proven Solutions

### n8n Workflow Integration Issues

#### Issue: "n8n webhook not responding"
**Symptoms**: URL submission hangs or fails without response  
**Root Cause**: n8n workflow (ID: 8xTPT55gwzaepe62) is not active or webhook misconfigured  
**Solution**:
```typescript
// Check webhook call in AdLibraryImporter component
const response = await fetch(process.env.REACT_APP_N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ job_id: jobId, url: metaUrl })
});
```

**Prevention**:
- Verify n8n workflow is active and webhook URL is correct
- Implement timeout handling (30 seconds max)
- Add retry logic with exponential backoff

---

#### Issue: "Invalid Meta Ad Library URL"
**Symptoms**: n8n returns error or empty results  
**Root Cause**: URL format not recognized by Apify scraper  
**Solution**:
1. Ensure URL contains 'facebook.com/ads/library'
2. Check URL has proper query parameters
3. Test URL manually in Facebook Ad Library first

**URL Validation Pattern**:
```typescript
const isValidMetaUrl = (url: string) => {
  return url.includes('facebook.com/ads/library') && 
         (url.includes('?') || url.includes('&'));
};
```

---

### Media Download Issues

#### Issue: "Media download failed - file not found"
**Symptoms**: Download status shows 'failed', thumbnail doesn't load  
**Root Cause**: Facebook media URL expired or changed  
**Solution**:
```typescript
// Retry configuration in backend mediaDownloader
const RETRY_CONFIG = {
  maxAttempts: 4,
  delays: [0, 2000, 8000, 30000], // immediate, 2s, 8s, 30s
  shouldRetry: (error) => error.status !== 404
};
```

**Prevention**:
- Process media downloads immediately after scraping
- Implement fallback to preview_image_url for videos
- Log failed URLs for manual review

---

#### Issue: "Supabase Storage upload failed"
**Symptoms**: Media downloaded but thumbnail doesn't appear  
**Root Cause**: Storage bucket permissions or file size limits  
**Solution**:
1. Check Supabase Storage bucket 'ad-media' exists and is accessible
2. Verify file size is under 50MB limit
3. Ensure proper file path structure: `/{job_id}/media/{ad_archive_id}.{ext}`

**Upload Code Pattern**:
```typescript
const { data, error } = await supabase.storage
  .from('ad-media')
  .upload(`${jobId}/media/${adArchiveId}.${extension}`, fileBuffer, {
    contentType: mimeType,
    upsert: true
  });
```

---

### Database and Real-time Issues

#### Issue: "Table not updating in real-time"
**Symptoms**: New ads don't appear automatically, manual refresh required  
**Root Cause**: Supabase real-time subscription not working  
**Solution**:
```typescript
// Check useRealtimeAds hook configuration
useEffect(() => {
  const subscription = supabase
    .channel('ads_changes')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ads' },
        handleAdUpdate)
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

**Prevention**:
- Ensure table has REPLICA IDENTITY FULL enabled
- Check subscription is properly cleaned up on unmount
- Monitor network connectivity

---

#### Issue: "Job ID mismatch in ads table"
**Symptoms**: Ads appear under wrong job or don't appear at all  
**Root Cause**: n8n workflow not properly adding job_id to each ad  
**Solution**:
1. Check "Edit Fields" node in n8n workflow
2. Verify job_id is being passed from webhook correctly
3. Ensure each ad object includes job_id before database insert

**n8n Edit Fields Configuration**:
```javascript
// In Edit Fields node
return items.map(item => ({
  ...item.json,
  job_id: $('Webhook').first().json.body.job_id
}));
```

---

### UI and Performance Issues

#### Issue: "Table loading slowly with many ads"
**Symptoms**: UI becomes sluggish, high memory usage  
**Root Cause**: Too many DOM elements, large images not optimized  
**Solution**:
```typescript
// Implement virtualization for large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

// Use thumbnail optimization
const thumbnailUrl = useMemo(() => 
  local_thumbnail_url || 
  `${local_media_url}?width=150&height=150&resize=cover`
, [local_thumbnail_url, local_media_url]);
```

**Prevention**:
- Implement pagination or virtualization for >100 ads
- Use compressed thumbnails (150x150px max)
- Lazy load images outside viewport

---

#### Issue: "Preview modal not opening or crashes"
**Symptoms**: Click on thumbnail does nothing or causes error  
**Root Cause**: Missing media file or corrupted data  
**Solution**:
1. Check if local_media_url exists and is accessible
2. Implement fallback to original media_url
3. Add error boundary around modal component

**Modal Error Handling**:
```typescript
const MediaDisplay = ({ ad }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return <div>Media failed to load. <button onClick={retry}>Retry</button></div>;
  }
  
  return (
    <img 
      src={ad.local_media_url || ad.media_url}
      onError={() => setError(true)}
      alt="Ad media"
    />
  );
};
```

---

### Bundle Size and Performance Issues

#### Issue: "Application loads slowly"
**Symptoms**: Initial page load takes >3 seconds  
**Root Cause**: Large bundle size from dependencies  
**Current Status**: Target bundle size <500KB  
**Solution**:
```typescript
// Implement code splitting for preview modal
const AdPreviewModal = lazy(() => import('./AdPreviewModal'));

// Use dynamic imports for heavy components
const loadVideoPlayer = () => import('./VideoPlayer');
```

**Bundle Optimization**:
- Code split preview modal and video player
- Use exact dependency versions (no ^ ranges)
- Monitor bundle size with webpack-bundle-analyzer
- Implement lazy loading for non-critical features

---

### Development and Build Issues

#### Issue: TypeScript Build Errors
**Symptoms**: Build fails with type errors  
**Root Cause**: Strict TypeScript configuration or missing type definitions  
**Solution**:
```bash
# Check for type errors
npm run build

# Common fixes for this project:
# 1. Ensure Supabase types are properly generated
# 2. Check ad object type definitions match database schema
# 3. Verify React component prop types
```

**Common Type Fixes**:
```typescript
// Generate Supabase types
npx supabase gen types typescript --project-id [your-project-id] > src/types/database.types.ts

// Ad object type
interface Ad {
  id: string;
  ad_archive_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  local_media_url?: string;
  download_status: 'pending' | 'downloading' | 'completed' | 'failed';
  job_id: string;
}
```

---

### Mobile/Responsive Issues

#### Issue: Table not responsive on mobile
**Symptoms**: Table columns overflow on small screens  
**Current Status**: Basic responsive design needed  
**Solution**:
```tsx
// Implement responsive table with card layout on mobile
<div className="hidden md:block">
  <DataTable columns={columns} data={ads} />
</div>
<div className="md:hidden">
  <AdCardList ads={ads} />
</div>
```

**Mobile Considerations**:
- Stack table columns vertically on mobile
- Use card layout instead of table rows
- Implement swipe gestures for ad navigation
- Optimize thumbnail sizes for mobile bandwidth

---

## Debugging Tools and Techniques

### Console Logging
Key debug points in the Facebook Ad Manager application:

```typescript
// n8n webhook debugging
console.log('Webhook request:', { job_id: jobId, url: metaUrl });
console.log('Webhook response:', response);

// Media download debugging
console.log('Download started:', { ad_archive_id, media_url });
console.log('Download completed:', { local_url, file_size });

// Real-time subscription debugging
console.log('Subscription event:', { event, payload });
console.log('Ad table updated:', updatedAds.length);

// Performance monitoring
console.time('table-render');
renderAdTable();
console.timeEnd('table-render');

// Error logging
console.error('n8n webhook error:', error);
console.error('Media download failed:', error);
console.error('Supabase operation failed:', error);
```

### State Inspection
Use browser dev tools to inspect component state:

```typescript
// Check scraping job state
jobState: {
  status: 'pending' | 'scraping' | 'downloading' | 'completed' | 'failed',
  total_ads: number,
  scraped_ads: number,
  downloaded_ads: number,
  error_message: string | null
}

// Check ad table state
{
  ads: Ad[],
  filteredAds: Ad[],
  selectedIds: string[],
  mediaFilter: 'all' | 'video' | 'image',
  isLoading: boolean
}

// Check preview modal state
modalState: {
  isOpen: boolean,
  selectedAd: Ad | null,
  mediaLoaded: boolean,
  error: string | null
}
```

### Network Debugging
1. Open browser Network tab
2. Look for failed requests to n8n webhook
3. Check Supabase API calls and responses
4. Monitor media download requests
5. Verify CORS settings for cross-origin requests

### Local Development Debugging
```bash
# Start React development server
npm run dev

# Check TypeScript compilation
npm run build

# Run linting
npm run lint

# Monitor bundle size
npm run analyze
```

---

## Error Recovery Patterns

### Automatic Recovery
- **Media Download Retry**: Automatic retry with exponential backoff [0ms, 2s, 8s, 30s]
- **n8n Webhook Retry**: Automatic retry for failed webhook calls
- **Real-time Reconnection**: Automatic Supabase subscription reconnection

### Manual Recovery
- **Page Refresh**: Clears all state and reconnects subscriptions
- **Job Restart**: Re-submit URL to restart scraping process
- **Individual Media Retry**: Retry button for failed media downloads

### Progressive Recovery
1. **Automatic Retry**: Built-in retry mechanisms activate first
2. **Manual Retry**: User-triggered retry for specific failures
3. **Job Restart**: Full job restart if multiple failures occur
4. **Support Contact**: Escalate persistent issues

---

## Known Limitations

### Current Limitations
1. **Single Job Processing**: One scraping job at a time
2. **Media URL Expiration**: Facebook URLs may expire before download
3. **File Size Limits**: 50MB limit for media files in Supabase Storage
4. **No Offline Support**: Requires internet for all operations
5. **Bundle Size**: Target <500KB (monitor with webpack-bundle-analyzer)
6. **Table Performance**: May slow with >500 ads (virtualization needed)
7. **Mobile Experience**: Basic responsive design, not fully optimized

### Planned Improvements
1. **Code Splitting**: Preview modal and video player optimization
2. **Enhanced Mobile**: Card layout and touch gestures
3. **Batch Operations**: Multiple job processing
4. **Advanced Filtering**: Search, date range, page name filters

---

## Archive Reference

This troubleshooting guide replaces previous PDF OCR project troubleshooting. Key patterns retained:
- Retry logic with exponential backoff
- Bundle size monitoring and optimization
- Error boundary implementation
- Network debugging approaches

---

## Escalation Guidelines

### When to Contact Support
1. **Persistent n8n Failures**: Webhook consistently fails after retries
2. **Data Loss**: Ads disappear or job data corrupted
3. **Security Concerns**: Unauthorized access or data exposure
4. **Performance Issues**: Consistent timeouts or memory leaks

### What Information to Provide
1. **URL Details**: Meta Ad Library URL and job ID
2. **Error Messages**: Complete error text and browser console logs
3. **Browser Information**: Version, operating system, network details
4. **Session Details**: Time of occurrence, number of ads, file sizes

### Temporary Workarounds
1. **Different URL**: Try alternative Meta Ad Library search URL
2. **Smaller Dataset**: Use filtered search with fewer results
3. **Different Browser**: Test in Chrome/Firefox/Safari
4. **Network Change**: Try different internet connection
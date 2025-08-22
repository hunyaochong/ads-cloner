# CLAUDE-troubleshooting.md

## Common Issues and Proven Solutions

### PDF Loading Issues

#### Issue: "PDF worker loading failed"
**Symptoms**: PDF fails to load with worker-related error message  
**Root Cause**: PDF.js worker not loading from CDN  
**Solution**:
```typescript
// Check src/utils/pdfUtils.ts configuration
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;
```

**Prevention**:
- Ensure stable internet connection for CDN access
- Consider local worker hosting for offline scenarios

---

#### Issue: "Invalid or corrupted PDF file"
**Symptoms**: PDF viewer shows error, file appears corrupted  
**Root Cause**: File corruption or unsupported PDF format  
**Solution**:
1. Verify file is actually a PDF (check file extension vs. content type)
2. Try opening PDF in another viewer to confirm validity
3. Re-export or recreate the PDF from source

**Code Pattern**:
```typescript
// Validation logic in src/services/api.ts
if (file.type !== 'application/pdf') {
  throw new OCRApiError('Only PDF files are supported', 'validation');
}
```

---

### Text Search and Highlighting Issues

#### Issue: Text Search Performance Degradation
**Symptoms**: Search becomes slow with large documents or complex queries  
**Root Cause**: Inefficient regex compilation or excessive re-renders  
**Solution**:
```typescript
// Check useTextSearch configuration
// Default debounce is 300ms, increase for better performance
const searchHook = useTextSearch(text, 500); // Increase debounce

// Monitor regex cache size in browser dev tools
console.log('Regex cache size:', regexCacheRef.current.size);
```

**Prevention**:
- Use appropriate debounce delays for search input
- Monitor regex cache performance in large documents
- Avoid extremely complex search patterns

---

#### Issue: Text Highlighting Memory Issues
**Symptoms**: Browser becomes slow with highlighted text, high memory usage  
**Root Cause**: Large number of highlighted elements in DOM  
**Solution**:
1. Clear search highlights when not needed
2. Use shorter search queries for better performance
3. Consider pagination for very large documents

**Code Pattern**:
```typescript
// Clear search when component unmounts
useEffect(() => {
  return () => {
    searchHook.clearSearch();
  };
}, []);
```

---

### OCR Processing Issues

#### Issue: "Request timed out after 10 minutes"
**Symptoms**: OCR processing fails with timeout error  
**Root Cause**: Large PDF files or server processing delays  
**Solution**:
1. Check file size (should be under 100MB)
2. Try with a smaller/simpler PDF first
3. Use retry mechanism (automatic with exponential backoff)

**Retry Configuration**:
```typescript
// src/utils/errorHandling.ts
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 4,
  delays: [0, 2000, 8000, 30000], // immediate, 2s, 8s, 30s
  shouldRetry: (error: OCRApiError) => error.retryable
};
```

---

#### Issue: "Empty response from OCR service"
**Symptoms**: OCR completes but returns no text  
**Root Cause**: PDF contains no extractable text/images, or OCR service issue  
**Solutions**:
1. Verify PDF contains text or clear images
2. Check PDF is not password-protected
3. Try with a known-good PDF to test service availability

**Detection Logic**:
```typescript
if (!text || text.trim().length === 0) {
  throw new OCRApiError(
    'Empty response from OCR service',
    'processing',
    response.status,
    true
  );
}
```

---

#### Issue: "Network error - please check your connection"
**Symptoms**: API calls fail immediately  
**Root Cause**: Network connectivity or firewall blocking  
**Solutions**:
1. Check internet connection
2. Verify webhook URL is accessible: `https://primary-production-6654.up.railway.app/webhook/9d000de0-872a-4443-9c57-b339fc8ef60c`
3. Check corporate firewall/proxy settings
4. Try from different network

---

### File Upload Issues

#### Issue: "File size exceeds maximum limit of 100MB"
**Symptoms**: Upload rejected before processing  
**Root Cause**: File too large for processing  
**Solutions**:
1. Compress PDF using online tools or PDF editors
2. Split large documents into smaller sections
3. Reduce image quality/resolution in PDF

**Validation Logic**:
```typescript
if (file.size > this.MAX_FILE_SIZE) {
  const sizeMB = Math.round(file.size / (1024 * 1024));
  throw new OCRApiError(
    `File size (${sizeMB}MB) exceeds maximum limit of 100MB`,
    'validation'
  );
}
```

---

#### Issue: Custom Upload Dialog Not Responding
**Symptoms**: Drag and drop not working, upload button disabled  
**Root Cause**: FileUploadDialog validation or drag event handling issues  
**Solution**:
```typescript
// Check FileUploadDialog component
// Ensure drag event handlers are properly bound
// Verify file validation logic for accepted types
```

---

### Performance Issues

#### Issue: Bundle Size Too Large (~890KB Total)
**Symptoms**: Slow page loads, performance warnings  
**Root Cause**: PDF.js and react-pdf contribute significant bundle size  
**Current Status**: Known issue, optimization planned for Phase 4  
**Current Bundle Breakdown**:
- Main JS Bundle: 857KB
- Main CSS Bundle: 33KB
- Total: ~890KB (target <600KB)

**Planned Solutions**:
- Code splitting for PDF viewer
- Dynamic imports for Google Docs export
- Bundle analysis and optimization
- Vendor chunk separation

---

#### Issue: High Memory Usage
**Symptoms**: Browser becomes slow, memory usage high  
**Root Cause**: Large PDF loaded in memory + text output  
**Solutions**:
1. Close other browser tabs
2. Refresh page to clear memory
3. Process smaller PDFs if possible

---

### Build and Development Issues

#### Issue: TypeScript Build Errors
**Symptoms**: Build fails with type errors  
**Root Cause**: Strict TypeScript configuration  
**Solution**:
```bash
# Check for type errors
npm run build

# Common fixes:
# 1. Ensure all imports have proper types
# 2. Check useRef typing for DOM elements
# 3. Verify event handler parameter types
```

---

### Mobile/Responsive Issues

#### Issue: Poor Mobile Experience
**Symptoms**: Components don't fit on mobile screens  
**Current Status**: Basic responsive design implemented  
**Workaround**: Use panel toggle buttons to switch between PDF and text views  
**Planned Improvements**: Enhanced mobile experience in Phase 4

**Current Mobile Message**:
```tsx
<div className="md:hidden block p-4 bg-yellow-50 border-t border-yellow-200">
  <p className="text-sm text-yellow-800">
    💡 For the best experience, view this on a larger screen. On mobile, use the panel toggle buttons above to switch between PDF and text views.
  </p>
</div>
```

---

## Debugging Tools and Techniques

### Console Logging
Key debug points in the application:

```typescript
// OCR completion logging
console.log('OCR processing completed:', result);

// PDF loading logging
console.log(`PDF loaded with ${numPages} pages`);

// Text search debugging
console.log('Search executed:', { query, resultsCount: results.length });
console.log('Regex cache size:', regexCacheRef.current.size);

// Performance monitoring
console.time('search-execution');
executeSearch(query);
console.timeEnd('search-execution');

// Error logging
console.error('PDF loading error:', error);
console.error('Failed to copy text:', error);
console.error('Search regex compilation error:', error);
```

### Error State Inspection
Use browser dev tools to inspect component state:

```typescript
// Check OCR processing state
state: {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error',
  progress: number,
  error: OCRApiError | null,
  retryState: RetryState | null
}

// Check PDF viewer state
{
  numPages: number,
  currentPage: number,
  scale: number,
  isLoading: boolean,
  error: string | null
}

// Check text search state
searchState: {
  query: string,
  results: SearchResult[],
  currentIndex: number,
  isActive: boolean,
  isSearching: boolean
}
```

### Network Debugging
1. Open browser Network tab
2. Look for failed requests to Railway webhook
3. Check request/response details for API errors
4. Verify CORS headers if accessing from different domain

### Local Development Debugging
```bash
# Start development server with verbose logging
npm run dev

# Check for build issues
npm run build

# Lint for code issues
npm run lint
```

---

## Error Recovery Patterns

### Automatic Recovery
- **OCR Retry Logic**: Automatic retry with exponential backoff
- **PDF Reload**: Automatic retry button for failed PDF loads
- **State Reset**: Cancel/reset functionality to clear error states

### Manual Recovery
- **Page Refresh**: Clears all state and memory usage
- **File Re-upload**: Try with different file or re-exported PDF
- **Browser Restart**: For persistent memory/performance issues

### Progressive Recovery
1. **Try Again**: Use built-in retry mechanisms first
2. **Simplify**: Try with smaller/simpler PDF
3. **Alternative**: Use different PDF or different device/browser
4. **Escalate**: Contact support if issues persist

---

## Known Limitations

### Current Limitations
1. **Single File Processing**: Only one PDF at a time
2. **No Offline Support**: Requires internet for OCR processing
3. **Limited PDF Format Support**: Some complex PDFs may not render perfectly
4. **No Progress Granularity**: Cannot show detailed OCR progress steps
5. **Bundle Size**: Larger than optimal (890KB vs 600KB target)
6. **Text Search Limits**: Search performance degrades with very large documents (>50MB text)
7. **Highlighting Limits**: Complex highlighting patterns may impact performance
8. **Search Regex Cache**: Limited to 50 cached patterns, older patterns automatically cleared

### Planned Improvements
1. **Phase 4 Bundle Optimization**: Code splitting and dynamic imports
2. **Enhanced Mobile Support**: Touch gestures and improved responsive design
3. **Advanced Synchronized Scrolling**: Correlation between PDF pages and text sections

---

## Archive Reference

**Resolved Issues**: See `archive/resolved-issues.md` for:
- PDF "Dead White Space" issue (resolved August 19, 2025)
- Complete CSS Styling Failure (Tailwind v4→v3 migration, resolved August 20, 2025)

These archived issues provide valuable context for similar problems and solution patterns.

---

## Escalation Guidelines

### When to Contact Support
1. **Persistent API Errors**: OCR service consistently fails after retries
2. **Data Loss**: Processed text disappears unexpectedly
3. **Security Concerns**: Suspicious behavior or unauthorized access
4. **Performance Issues**: Consistent timeouts or crashes

### What Information to Provide
1. **File Details**: Size, type, and source of PDF
2. **Error Messages**: Complete error text and steps to reproduce
3. **Browser Information**: Version, operating system, network details
4. **Session Details**: Time of occurrence, retry attempts made

### Temporary Workarounds
1. **Use Alternative PDF**: Try different file to isolate issue
2. **Different Browser**: Test in Chrome/Firefox/Safari
3. **Network Change**: Try different internet connection
4. **File Modification**: Compress or re-export PDF from source
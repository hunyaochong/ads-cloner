import { useState } from 'react';
import { isValidMetaAdLibraryUrl } from '../lib/utils';

interface AdLibraryImporterProps {
  onJobCreated?: (jobId: string) => void;
}

export function AdLibraryImporter({ onJobCreated }: AdLibraryImporterProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(null);
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a Meta Ad Library URL');
      return;
    }

    if (!isValidMetaAdLibraryUrl(url)) {
      setError('Please enter a valid Meta Ad Library URL (facebook.com/ads/library/)');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/scraping-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create scraping job');
      }

      const data = await response.json();
      
      if (data.success && data.job) {
        setSuccess(`Job created successfully! Job ID: ${data.job.id}`);
        setUrl(''); // Clear the input
        onJobCreated?.(data.job.id);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Error creating scraping job:', err);
      setError(err instanceof Error ? err.message : 'Failed to create scraping job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Import from Meta Ad Library
        </h2>
        <p className="text-gray-600 text-sm">
          Enter a Meta Ad Library URL to scrape and download ad data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Ad Library URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Job...</span>
              </div>
            ) : (
              'Import Ads'
            )}
          </button>

          <div className="text-sm text-gray-500">
            Step 1: Create scraping job
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="text-green-500 mr-2">✅</div>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">How it works:</h3>
        <ol className="text-xs text-gray-600 space-y-1">
          <li>1. Enter a Meta Ad Library search URL</li>
          <li>2. System creates a scraping job and triggers n8n workflow</li>
          <li>3. Ads will appear in the table below as they are scraped</li>
          <li>4. Media files will download in the background</li>
        </ol>
      </div>
    </div>
  );
}
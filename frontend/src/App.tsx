import { useState } from 'react';
import { AdLibraryImporter } from './components/AdLibraryImporter';

function App() {
  // Check environment configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const n8nWebhook = import.meta.env.VITE_N8N_WEBHOOK_URL;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const isEnvConfigured = supabaseUrl && supabaseKey && n8nWebhook && apiUrl &&
    supabaseUrl !== 'your_supabase_url_here' &&
    supabaseKey !== 'your_supabase_anon_key_here' &&
    n8nWebhook !== 'your_n8n_webhook_url_here';

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // If environment is not configured, show setup status
  if (!isEnvConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Facebook Ad Manager
          </h1>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-600 mb-6">
              Frontend foundation setup complete. Please configure environment variables.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>React + TypeScript with Vite</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Tailwind CSS 3.4.17</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Project structure</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Environment configuration (pending)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Facebook Ad Manager
          </h1>
          <p className="text-gray-600">
            Import and manage Facebook ads from the Meta Ad Library
          </p>
        </header>

        {/* URL Import Section */}
        <AdLibraryImporter 
          onJobCreated={(jobId) => setCurrentJobId(jobId)}
        />

        {/* Placeholder for future components */}
        {currentJobId && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Status
            </h2>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Job created: <code className="font-mono">{currentJobId}</code>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Next: Job progress tracking will appear here (Step 2)
              </p>
            </div>
          </div>
        )}

        {/* Development Status */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Phase 2 Progress</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Step 1: URL Input Interface ✅</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Step 2: Skeleton Progress Tracking (next)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Step 3: Basic Ads Table</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App

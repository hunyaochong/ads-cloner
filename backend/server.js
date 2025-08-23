import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import MediaDownloader from './services/mediaDownloader.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Check required environment variables
function validateEnvironment() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value === 'your_supabase_url_here' || value === 'your_supabase_service_key_here';
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please update backend/.env with your Supabase credentials');
    console.error('   You can find these in your Supabase Dashboard > Settings > API');
    return false;
  }
  return true;
}

// Initialize Supabase client only if environment is valid
let supabase = null;
if (validateEnvironment()) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// Initialize MediaDownloader
const mediaDownloader = new MediaDownloader();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Facebook Ad Manager API'
  });
});

// Test Supabase connection
app.get('/api/test-db', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ 
      success: false, 
      message: 'Supabase client not initialized - check environment variables' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('count', { count: 'exact' });

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Database connection successful',
      table_exists: true
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Create scraping job endpoint
app.post('/api/scraping-jobs', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not available - check environment variables' });
    }

    // Create the job in Supabase
    const { data, error } = await supabase
      .from('scraping_jobs')
      .insert({
        url,
        status: 'pending',
        total_ads: 0,
        scraped_ads: 0,
        downloaded_ads: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update job status to 'scraping' before calling n8n
    await supabase
      .from('scraping_jobs')
      .update({ status: 'scraping' })
      .eq('id', data.id);

    // Trigger n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        console.log(`🔗 Triggering n8n webhook for job ${data.id}`);
        console.log(`   URL: ${url}`);
        
        // Try POST first, then GET if it fails
        let n8nResponse;
        try {
          n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              job_id: data.id,
              url: url
            })
          });
        } catch (postError) {
          console.log('POST failed, trying GET method...');
          const urlParams = new URLSearchParams({
            job_id: data.id,
            url: url
          });
          n8nResponse = await fetch(`${n8nWebhookUrl}?${urlParams}`, {
            method: 'GET'
          });
        }

        if (!n8nResponse.ok) {
          const errorText = await n8nResponse.text();
          console.error('n8n webhook error:', errorText);
          
          // Update job status to failed
          await supabase
            .from('scraping_jobs')
            .update({ 
              status: 'failed',
              error_message: `n8n webhook failed: ${errorText}`
            })
            .eq('id', data.id);
        } else {
          console.log('✅ n8n webhook triggered successfully');
        }
      } catch (webhookError) {
        console.error('Error calling n8n webhook:', webhookError);
        
        // Update job status to failed
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'failed',
            error_message: `Webhook error: ${webhookError.message}`
          })
          .eq('id', data.id);
      }
    } else {
      console.warn('⚠️  N8N_WEBHOOK_URL not configured - skipping webhook trigger');
    }

    res.json({ success: true, job: data });
  } catch (error) {
    console.error('Error creating scraping job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraping job endpoint
app.get('/api/scraping-jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching scraping job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ads for a job
app.get('/api/ads', async (req, res) => {
  try {
    const { job_id } = req.query;

    let query = supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download media for specific ads
app.post('/api/download-media', async (req, res) => {
  try {
    const { ad_ids } = req.body;
    
    if (!ad_ids || !Array.isArray(ad_ids)) {
      return res.status(400).json({ error: 'ad_ids array is required' });
    }

    const result = await mediaDownloader.queueDownloads(ad_ids);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `${result.queued} ads queued for download`,
        queued: result.queued
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download media for entire job
app.post('/api/download-job-media/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await mediaDownloader.downloadJobMedia(jobId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error starting job download:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get download queue status
app.get('/api/download-status', (req, res) => {
  const status = mediaDownloader.getQueueStatus();
  res.json(status);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize MediaDownloader (will warn if Supabase not available)
    if (supabase) {
      await mediaDownloader.initialize();
      console.log('✅ MediaDownloader initialized successfully');
    } else {
      console.warn('⚠️  MediaDownloader initialization skipped - Supabase credentials needed');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database test: http://localhost:${PORT}/api/test-db`);
      console.log(`📥 Download status: http://localhost:${PORT}/api/download-status`);
      
      if (!supabase) {
        console.log('\n⚠️  NOTICE: Supabase not configured');
        console.log('   Update backend/.env with your credentials to enable full functionality');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Don't exit if it's just missing credentials
    if (error.message?.includes('supabase')) {
      console.log('🔄 Starting server anyway without Supabase functionality...');
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (limited functionality)`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
      });
    } else {
      process.exit(1);
    }
  }
}

startServer();

export default app;
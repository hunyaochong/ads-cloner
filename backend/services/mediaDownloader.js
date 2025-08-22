import { createClient } from '@supabase/supabase-js';
import StorageService from './storageService.js';

// Initialize Supabase client with validation
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (supabaseUrl && supabaseServiceKey && 
      supabaseUrl !== 'your_supabase_url_here' && 
      supabaseServiceKey !== 'your_supabase_service_key_here') {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.warn('⚠️  MediaDownloader: Supabase client initialization failed');
}

export class MediaDownloader {
  constructor() {
    this.storageService = new StorageService();
    this.downloadQueue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize the media downloader
   */
  async initialize() {
    console.log('🔧 Initializing MediaDownloader...');
    
    if (!supabase) {
      console.warn('⚠️  MediaDownloader: Supabase client not available - limited functionality');
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    // Initialize storage bucket
    const storageResult = await this.storageService.initializeBucket();
    if (!storageResult.success) {
      throw new Error(`Storage initialization failed: ${storageResult.error}`);
    }

    console.log('✅ MediaDownloader initialized successfully');
    return { success: true };
  }

  /**
   * Add ads to download queue
   */
  async queueDownloads(adIds) {
    try {
      // Fetch ad details
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .in('id', adIds)
        .eq('download_status', 'pending');

      if (error) {
        throw error;
      }

      // Add to queue
      this.downloadQueue.push(...ads);
      
      console.log(`📥 Added ${ads.length} ads to download queue`);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return { success: true, queued: ads.length };
    } catch (error) {
      console.error('Error queueing downloads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process download queue with retry logic
   */
  async processQueue() {
    if (this.isProcessing || this.downloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.downloadQueue.length} downloads...`);

    while (this.downloadQueue.length > 0) {
      const ad = this.downloadQueue.shift();
      
      try {
        // Update status to downloading
        await this.updateAdStatus(ad.id, 'downloading');

        // Download and store media
        const results = await this.storageService.downloadAndStore(ad);

        // Update ad record with results
        await this.storageService.updateAdDownloadStatus(ad.id, results);

        // Update job progress
        await this.updateJobProgress(ad.job_id);

        if (results.errors.length === 0) {
          console.log(`✅ Successfully downloaded ad ${ad.ad_archive_id}`);
        } else {
          console.log(`⚠️  Downloaded ad ${ad.ad_archive_id} with errors: ${results.errors.join('; ')}`);
        }

      } catch (error) {
        console.error(`❌ Failed to download ad ${ad.ad_archive_id}:`, error);
        
        // Mark as failed
        await this.updateAdStatus(ad.id, 'failed', error.message);
        await this.updateJobProgress(ad.job_id);
      }

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
    console.log('✅ Download queue processing completed');
  }

  /**
   * Update ad download status
   */
  async updateAdStatus(adId, status, error = null) {
    try {
      const { error: updateError } = await supabase
        .from('ads')
        .update({
          download_status: status,
          download_error: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', adId);

      if (updateError) {
        console.error('Error updating ad status:', updateError);
      }
    } catch (err) {
      console.error('Error updating ad status:', err);
    }
  }

  /**
   * Update job progress counters
   */
  async updateJobProgress(jobId) {
    try {
      // Get current ad counts for this job
      const { data: ads, error } = await supabase
        .from('ads')
        .select('download_status')
        .eq('job_id', jobId);

      if (error) {
        throw error;
      }

      const totalAds = ads.length;
      const downloadedAds = ads.filter(ad => ad.download_status === 'completed').length;
      const failedAds = ads.filter(ad => ad.download_status === 'failed').length;

      // Update job status
      let jobStatus = 'downloading';
      if (downloadedAds + failedAds === totalAds) {
        jobStatus = 'completed';
      }

      const { error: updateError } = await supabase
        .from('scraping_jobs')
        .update({
          total_ads: totalAds,
          downloaded_ads: downloadedAds,
          status: jobStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Error updating job progress:', updateError);
      }

    } catch (error) {
      console.error('Error updating job progress:', error);
    }
  }

  /**
   * Get download queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.downloadQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Download media for a specific job
   */
  async downloadJobMedia(jobId) {
    try {
      // Get all pending ads for this job
      const { data: ads, error } = await supabase
        .from('ads')
        .select('id')
        .eq('job_id', jobId)
        .eq('download_status', 'pending');

      if (error) {
        throw error;
      }

      if (ads.length === 0) {
        return { success: true, message: 'No pending downloads found' };
      }

      // Queue downloads
      const result = await this.queueDownloads(ads.map(ad => ad.id));
      return result;

    } catch (error) {
      console.error('Error downloading job media:', error);
      return { success: false, error: error.message };
    }
  }
}

export default MediaDownloader;
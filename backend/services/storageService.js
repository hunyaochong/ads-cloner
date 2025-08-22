import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

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
  console.warn('⚠️  StorageService: Supabase client initialization failed');
}

export class StorageService {
  constructor() {
    this.bucketName = 'ad-media';
  }

  /**
   * Ensure the ad-media bucket exists and is properly configured
   */
  async initializeBucket() {
    if (!supabase) {
      console.warn('⚠️  StorageService: Supabase client not available - skipping bucket initialization');
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets.find(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });

        if (error) {
          throw new Error(`Failed to create bucket: ${error.message}`);
        }

        console.log(`✅ Created storage bucket: ${this.bucketName}`);
      } else {
        console.log(`✅ Storage bucket already exists: ${this.bucketName}`);
      }

      return { success: true, bucketName: this.bucketName };
    } catch (error) {
      console.error('Storage initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate storage path for a file
   */
  generateStoragePath(jobId, adArchiveId, mediaType, isThumb = false) {
    const extension = mediaType === 'video' ? 'mp4' : 'jpg';
    const folder = isThumb ? 'thumbnails' : 'media';
    const suffix = isThumb ? '_thumb' : '';
    return `${jobId}/${folder}/${adArchiveId}${suffix}.${extension}`;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(localFilePath, storagePath, contentType) {
    try {
      const fileBuffer = await fs.readFile(localFilePath);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      return {
        success: true,
        storagePath,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error(`Upload error for ${storagePath}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download media using Python script and upload to Supabase Storage
   */
  async downloadAndStore(ad) {
    try {
      const { id, ad_archive_id, media_url, media_type, preview_image_url, job_id } = ad;

      // Create temporary directory for downloads
      const tempDir = `/tmp/fb_ads_${job_id}`;
      await fs.mkdir(tempDir, { recursive: true });

      const results = {
        media: null,
        thumbnail: null,
        errors: []
      };

      // Download main media file
      const mediaPath = await this.downloadWithPython(media_url, tempDir, ad_archive_id, media_type);
      if (mediaPath) {
        const mediaStoragePath = this.generateStoragePath(job_id, ad_archive_id, media_type);
        const contentType = media_type === 'video' ? 'video/mp4' : 'image/jpeg';
        
        const uploadResult = await this.uploadFile(mediaPath, mediaStoragePath, contentType);
        if (uploadResult.success) {
          results.media = uploadResult;
        } else {
          results.errors.push(`Media upload failed: ${uploadResult.error}`);
        }

        // Clean up local file
        await fs.unlink(mediaPath).catch(() => {});
      } else {
        results.errors.push('Media download failed');
      }

      // Download thumbnail for videos
      if (media_type === 'video' && preview_image_url) {
        const thumbPath = await this.downloadWithPython(preview_image_url, tempDir, `${ad_archive_id}_thumb`, 'image');
        if (thumbPath) {
          const thumbStoragePath = this.generateStoragePath(job_id, ad_archive_id, media_type, true);
          
          const uploadResult = await this.uploadFile(thumbPath, thumbStoragePath, 'image/jpeg');
          if (uploadResult.success) {
            results.thumbnail = uploadResult;
          } else {
            results.errors.push(`Thumbnail upload failed: ${uploadResult.error}`);
          }

          // Clean up local file
          await fs.unlink(thumbPath).catch(() => {});
        }
      }

      // Clean up temp directory
      await fs.rmdir(tempDir, { recursive: true }).catch(() => {});

      return results;
    } catch (error) {
      console.error('Download and store error:', error);
      return {
        media: null,
        thumbnail: null,
        errors: [error.message]
      };
    }
  }

  /**
   * Download file using Python script
   */
  async downloadWithPython(url, outputDir, filename, type) {
    return new Promise((resolve, reject) => {
      const pythonScript = process.env.PYTHON_SCRIPT_PATH || '../ad_media_downloader.py';
      const extension = type === 'video' ? 'mp4' : 'jpg';
      const outputPath = path.join(outputDir, `${filename}.${extension}`);

      // Run Python script with single file download
      const pythonProcess = spawn('python3', [
        pythonScript,
        '--single-url', url,
        '--output-dir', outputDir,
        '--filename', `${filename}.${extension}`
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          // Check if file exists
          try {
            await fs.access(outputPath);
            resolve(outputPath);
          } catch {
            reject(new Error('Download completed but file not found'));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  /**
   * Update ad record with download results
   */
  async updateAdDownloadStatus(adId, results) {
    try {
      const updateData = {
        download_status: results.errors.length === 0 ? 'completed' : 'failed',
        download_error: results.errors.length > 0 ? results.errors.join('; ') : null,
        updated_at: new Date().toISOString()
      };

      if (results.media?.success) {
        updateData.local_media_url = results.media.publicUrl;
      }

      if (results.thumbnail?.success) {
        updateData.local_thumbnail_url = results.thumbnail.publicUrl;
      }

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', adId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating ad download status:', error);
      return { success: false, error: error.message };
    }
  }
}

export default StorageService;
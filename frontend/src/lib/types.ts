// Database types matching the Supabase schema

export interface ScrapingJob {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'downloading' | 'completed' | 'failed';
  total_ads: number;
  scraped_ads: number;
  downloaded_ads: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  ad_archive_id: string;
  ad_url?: string;
  is_active: boolean;
  page_name?: string;
  
  // Original URLs from n8n scraping
  media_url: string;
  media_type: 'image' | 'video';
  preview_image_url?: string; // For videos only, null for images
  
  // Local media after download
  local_media_url?: string; // Main media file in Supabase Storage
  local_thumbnail_url?: string; // Thumbnail
  download_status: 'pending' | 'downloading' | 'completed' | 'failed';
  download_error?: string;
  
  // Ad metadata
  caption?: string;
  cta?: string;
  title?: string;
  description?: string;
  start_date?: number;
  start_date_formatted?: string;
  end_date?: number;
  end_date_formatted?: string;
  duration_days?: number;
  
  // Job tracking
  job_id: string;
  created_at: string;
  updated_at: string;
}

// Component props types
export interface MediaTypeFilter {
  filter: 'all' | 'video' | 'image';
  setFilter: (filter: 'all' | 'video' | 'image') => void;
}

export interface AdTableProps {
  ads: Ad[];
  loading: boolean;
  onAdSelect: (ad: Ad) => void;
  selectedAds: string[];
  onBulkSelect: (adIds: string[]) => void;
}

export interface AdPreviewModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date utilities
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

// Media type utilities
export function getMediaTypeFromUrl(url: string): 'image' | 'video' {
  const extension = url.split('.').pop()?.toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  return videoExtensions.includes(extension || '') ? 'video' : 'image';
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// URL validation
export function isValidMetaAdLibraryUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.facebook.com' && 
           urlObj.pathname.startsWith('/ads/library/');
  } catch {
    return false;
  }
}

// Generate storage path for Supabase
export function generateStoragePath(jobId: string, adArchiveId: string, mediaType: 'image' | 'video', isThumb = false): string {
  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const folder = isThumb ? 'thumbnails' : 'media';
  const suffix = isThumb ? '_thumb' : '';
  return `${jobId}/${folder}/${adArchiveId}${suffix}.${extension}`;
}
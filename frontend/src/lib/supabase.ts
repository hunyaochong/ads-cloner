import { createClient } from '@supabase/supabase-js';
import type { Ad, ScrapingJob } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      scraping_jobs: {
        Row: ScrapingJob;
        Insert: Omit<ScrapingJob, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScrapingJob, 'id' | 'created_at' | 'updated_at'>>;
      };
      ads: {
        Row: Ad;
        Insert: Omit<Ad, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Ad, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Typed client
export const typedSupabase = supabase as ReturnType<typeof createClient<Database>>;
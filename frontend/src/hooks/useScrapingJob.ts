import { useState, useEffect } from 'react';
import { typedSupabase } from '../lib/supabase';
import type { ScrapingJob } from '../lib/types';

interface UseScrapingJobProps {
  jobId: string;
}

export function useScrapingJob({ jobId }: UseScrapingJobProps) {
  const [job, setJob] = useState<ScrapingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;

    async function fetchJob() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await typedSupabase
          .from('scraping_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setJob(data);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
      } finally {
        setLoading(false);
      }
    }

    function setupRealtimeSubscription() {
      const subscriptionQuery = typedSupabase
        .channel(`job_${jobId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'scraping_jobs',
          filter: `id=eq.${jobId}`
        }, (payload) => {
          console.log('Job update:', payload);
          setJob(payload.new as ScrapingJob);
        })
        .subscribe();

      return subscriptionQuery;
    }

    // Fetch initial data and set up subscription
    fetchJob().then(() => {
      subscription = setupRealtimeSubscription();
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [jobId]);

  const refetch = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await typedSupabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setJob(data);
      setError(null);
    } catch (err) {
      console.error('Error refetching job:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch job');
    } finally {
      setLoading(false);
    }
  };

  return {
    job,
    loading,
    error,
    refetch
  };
}
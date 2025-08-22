import { useState, useEffect } from 'react';
import { typedSupabase } from '../lib/supabase';
import type { Ad } from '../lib/types';

interface UseRealtimeAdsProps {
  jobId?: string;
}

export function useRealtimeAds({ jobId }: UseRealtimeAdsProps = {}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;

    async function fetchInitialAds() {
      try {
        setLoading(true);
        setError(null);

        let query = typedSupabase
          .from('ads')
          .select('*')
          .order('created_at', { ascending: false });

        if (jobId) {
          query = query.eq('job_id', jobId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setAds(data || []);
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ads');
      } finally {
        setLoading(false);
      }
    }

    function setupRealtimeSubscription() {
      let subscriptionQuery = typedSupabase
        .channel('ads_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ads',
          filter: jobId ? `job_id=eq.${jobId}` : undefined
        }, (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setAds(current => [payload.new as Ad, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setAds(current => 
              current.map(ad => 
                ad.id === payload.new.id ? payload.new as Ad : ad
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAds(current => 
              current.filter(ad => ad.id !== payload.old.id)
            );
          }
        })
        .subscribe();

      return subscriptionQuery;
    }

    // Fetch initial data and set up subscription
    fetchInitialAds().then(() => {
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
      let query = typedSupabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAds(data || []);
      setError(null);
    } catch (err) {
      console.error('Error refetching ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch ads');
    } finally {
      setLoading(false);
    }
  };

  return {
    ads,
    loading,
    error,
    refetch
  };
}
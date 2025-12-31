import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ShareLink {
  id: string;
  share_code: string;
  click_count: number;
  reward_given: boolean;
  reward_credits: number;
  created_at: string;
  rewarded_at: string | null;
}

export const useShareLink = (taskId: string | null) => {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const REWARD_THRESHOLD = 3;

  // Generate a unique share code
  const generateShareCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Fetch existing share link for this task
  const fetchShareLink = async () => {
    if (!user || !taskId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setShareLink(data);
    } catch (err) {
      console.error('Error fetching share link:', err);
      setError('Failed to fetch share link');
    } finally {
      setLoading(false);
    }
  };

  // Create a new share link
  const createShareLink = async (): Promise<ShareLink | null> => {
    if (!user || !taskId) return null;

    setLoading(true);
    setError(null);
    try {
      const shareCode = generateShareCode();
      
      const { data, error: insertError } = await supabase
        .from('share_links')
        .insert({
          user_id: user.id,
          task_id: taskId,
          share_code: shareCode,
        })
        .select()
        .single();

      if (insertError) {
        // If duplicate, fetch existing
        if (insertError.code === '23505') {
          await fetchShareLink();
          return shareLink;
        }
        throw insertError;
      }

      setShareLink(data);
      return data;
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Failed to create share link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get or create share link
  const getOrCreateShareLink = async (): Promise<ShareLink | null> => {
    if (shareLink) return shareLink;
    
    await fetchShareLink();
    if (shareLink) return shareLink;
    
    return await createShareLink();
  };

  // Get the full share URL
  const getShareUrl = (code: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${code}`;
  };

  // Refresh share link data (to get updated click count)
  const refreshShareLink = async () => {
    await fetchShareLink();
  };

  useEffect(() => {
    if (user && taskId) {
      fetchShareLink();
    }
  }, [user, taskId]);

  return {
    shareLink,
    loading,
    error,
    createShareLink,
    getOrCreateShareLink,
    getShareUrl,
    refreshShareLink,
    REWARD_THRESHOLD,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'credits';
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses_count: number;
  per_user_limit: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface UserPromoCode {
  id: string;
  promo_code: PromoCode;
  used: boolean;
  used_at: string | null;
  claimed_at: string;
}

export const usePromoCodes = () => {
  const { user } = useAuth();
  const [userPromoCodes, setUserPromoCodes] = useState<UserPromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPromoCodes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase
        .from('user_promo_codes' as any)
        .select(`
          id,
          used,
          used_at,
          claimed_at,
          promo_code:promo_codes (
            id,
            code,
            discount_type,
            discount_value,
            min_purchase,
            max_uses,
            uses_count,
            per_user_limit,
            is_active,
            valid_from,
            valid_until,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching user promo codes:', error);
      } else {
        setUserPromoCodes((data as UserPromoCode[]) || []);
      }
    } catch (err) {
      console.error('Error fetching user promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPromoCodes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const searchPromoCode = async (code: string): Promise<PromoCode | null> => {
    try {
      const { data, error } = await (supabase
        .from('promo_codes' as any)
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle() as any);

      if (error) {
        console.error('Error searching promo code:', error);
        return null;
      }

      if (!data) return null;

      // Check validity dates
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) return null;
      if (data.valid_until && new Date(data.valid_until) < now) return null;

      // Check max uses
      if (data.max_uses && data.uses_count >= data.max_uses) return null;

      return data as PromoCode;
    } catch (err) {
      console.error('Error searching promo code:', err);
      return null;
    }
  };

  const claimPromoCode = async (promoCodeId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '로그인이 필요합니다' };

    try {
      // Check if already claimed
      const { data: existingClaim } = await (supabase
        .from('user_promo_codes' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code_id', promoCodeId)
        .maybeSingle() as any);

      if (existingClaim) {
        return { success: false, message: '이미 받은 프로모션 코드입니다' };
      }

      // Claim the promo code
      const { error } = await (supabase
        .from('user_promo_codes' as any)
        .insert({
          user_id: user.id,
          promo_code_id: promoCodeId,
        }) as any);

      if (error) {
        console.error('Error claiming promo code:', error);
        return { success: false, message: '프로모션 코드를 받는데 실패했습니다' };
      }

      await fetchUserPromoCodes();
      return { success: true, message: '프로모션 코드를 받았습니다!' };
    } catch (err) {
      console.error('Error claiming promo code:', err);
      return { success: false, message: '오류가 발생했습니다' };
    }
  };

  const useCreditsPromoCode = async (userPromoCodeId: string, promoCodeId: string, creditsToAdd: number): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '로그인이 필요합니다' };

    try {
      // Mark promo code as used
      const { error: updateError } = await (supabase
        .from('user_promo_codes' as any)
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', userPromoCodeId) as any);

      if (updateError) {
        console.error('Error updating promo code usage:', updateError);
        return { success: false, message: '프로모션 코드 사용에 실패했습니다' };
      }

      // Add credits using RPC function
      const { error: creditsError } = await (supabase.rpc as any)('add_credits', {
        p_user_id: user.id,
        p_credits: creditsToAdd
      });

      if (creditsError) {
        console.error('Error adding credits:', creditsError);
        // Fallback: try direct update
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', user.id)
          .single();

        if (currentProfile) {
          await supabase
            .from('profiles')
            .update({ credits: currentProfile.credits + creditsToAdd })
            .eq('user_id', user.id);
        }
      }

      // Update promo code usage count
      await (supabase.rpc as any)('increment_promo_usage', { p_promo_id: promoCodeId });

      await fetchUserPromoCodes();
      return { success: true, message: `${creditsToAdd}개의 이용권이 추가되었습니다!` };
    } catch (err) {
      console.error('Error using credits promo code:', err);
      return { success: false, message: '오류가 발생했습니다' };
    }
  };

  return {
    userPromoCodes,
    loading,
    searchPromoCode,
    claimPromoCode,
    useCreditsPromoCode,
    refreshPromoCodes: fetchUserPromoCodes,
  };
};

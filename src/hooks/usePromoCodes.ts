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
      // Use secure RPC function to search promo codes
      // This prevents exposure of sensitive business data (uses_count, max_uses, per_user_limit, etc.)
      const { data, error } = await (supabase.rpc as any)('search_promo_code', {
        p_code: code
      });

      if (error) {
        console.error('Error searching promo code:', error);
        return null;
      }

      if (!data || !data.found) return null;

      // Return promo code with only the fields exposed by the secure RPC
      return {
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        // These fields are not exposed by the RPC for security reasons
        min_purchase: null,
        max_uses: null,
        uses_count: 0,
        per_user_limit: 1,
        is_active: true,
        valid_from: null,
        valid_until: null,
        created_at: new Date().toISOString()
      } as PromoCode;
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
      // Use atomic server-side RPC for promo code redemption
      const { data, error } = await (supabase.rpc as any)('redeem_credits_promo', {
        p_user_promo_code_id: userPromoCodeId,
        p_promo_code_id: promoCodeId
      });

      if (error) {
        console.error('Error redeeming promo code:', error);
        return { success: false, message: '프로모션 코드 사용에 실패했습니다' };
      }

      if (data && !data.success) {
        return { success: false, message: data.error === 'Already used' ? '이미 사용된 프로모션 코드입니다' : '프로모션 코드 사용에 실패했습니다' };
      }

      const addedCredits = data?.credits_added || creditsToAdd;
      await fetchUserPromoCodes();
      return { success: true, message: `${addedCredits}개의 크레딧이 추가되었습니다!` };
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

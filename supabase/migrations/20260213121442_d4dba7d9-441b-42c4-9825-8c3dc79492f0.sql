
-- Fix 1: Revoke process_share_click from public/anon/authenticated (only service_role should call it)
REVOKE EXECUTE ON FUNCTION public.process_share_click(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_share_click(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_share_click(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_share_click(TEXT, TEXT) TO service_role;

-- Fix 2: Create atomic promo code redemption RPC
CREATE OR REPLACE FUNCTION public.redeem_credits_promo(
  p_user_promo_code_id UUID,
  p_promo_code_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_used BOOLEAN;
  v_credits INTEGER;
  v_discount_type TEXT;
BEGIN
  -- Check ownership and status
  SELECT upc.used, pc.discount_value, pc.discount_type
  INTO v_already_used, v_credits, v_discount_type
  FROM user_promo_codes upc
  JOIN promo_codes pc ON pc.id = upc.promo_code_id
  WHERE upc.id = p_user_promo_code_id
    AND upc.user_id = auth.uid()
    AND upc.promo_code_id = p_promo_code_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid promo code');
  END IF;

  IF v_already_used THEN
    RETURN json_build_object('success', false, 'error', 'Already used');
  END IF;

  IF v_discount_type != 'credits' THEN
    RETURN json_build_object('success', false, 'error', 'Not a credits promo code');
  END IF;

  -- Atomic: mark as used, add credits, increment usage
  UPDATE user_promo_codes
  SET used = true, used_at = NOW()
  WHERE id = p_user_promo_code_id;

  UPDATE profiles
  SET credits = credits + v_credits, updated_at = NOW()
  WHERE user_id = auth.uid();

  UPDATE promo_codes
  SET uses_count = uses_count + 1
  WHERE id = p_promo_code_id;

  RETURN json_build_object('success', true, 'credits_added', v_credits);
END;
$$;

-- Fix 3: Allow users to view their own payment logs
CREATE POLICY "Users can view their own payment logs"
ON public.payment_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix promo_codes exposure: Create secure RPC for public search
-- and restrict direct table access to only claimed codes

-- 1. Create a secure RPC function for searching promo codes by exact code
-- Returns only the fields needed for display, hides business-sensitive data
CREATE OR REPLACE FUNCTION public.search_promo_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo RECORD;
  v_now timestamptz := now();
BEGIN
  SELECT id, code, discount_type, discount_value, is_active, valid_from, valid_until, max_uses, uses_count
  INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(p_code)
    AND is_active = true;
  
  IF v_promo IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;
  
  -- Check validity dates
  IF v_promo.valid_from IS NOT NULL AND v_promo.valid_from > v_now THEN
    RETURN json_build_object('found', false);
  END IF;
  
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < v_now THEN
    RETURN json_build_object('found', false);
  END IF;
  
  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN json_build_object('found', false);
  END IF;
  
  -- Return only necessary public fields (hide business-sensitive data)
  RETURN json_build_object(
    'found', true,
    'id', v_promo.id,
    'code', v_promo.code,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value
  );
END;
$$;

-- 2. Drop the old permissive policy that exposes all data
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;

-- 3. Create new restrictive policy: users can only view promo codes they've claimed
CREATE POLICY "Users can view their claimed promo codes"
ON public.promo_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_promo_codes
    WHERE user_promo_codes.promo_code_id = promo_codes.id
    AND user_promo_codes.user_id = auth.uid()
  )
);
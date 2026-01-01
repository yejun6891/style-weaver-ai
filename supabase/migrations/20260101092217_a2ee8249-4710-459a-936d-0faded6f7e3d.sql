-- Fix add_credits function: only allow adding credits to own account
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_credits integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: only allow adding credits to own account
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only add credits to own account';
  END IF;

  UPDATE public.profiles
  SET credits = credits + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Fix increment_promo_usage function: only allow for promo codes owned by the user
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_promo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: user must own a user_promo_code record for this promo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_promo_codes 
    WHERE promo_code_id = p_promo_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: promo code not claimed by user';
  END IF;

  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = p_promo_id;
END;
$$;
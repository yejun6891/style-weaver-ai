-- Create atomic credit deduction function
-- This prevents race conditions where multiple concurrent requests could bypass credit limits
CREATE OR REPLACE FUNCTION public.try_deduct_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Atomically deduct 1 credit only if user has at least 1 credit
  UPDATE public.profiles
  SET credits = credits - 1,
      updated_at = now()
  WHERE user_id = p_user_id AND credits >= 1;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Grant execute permission to authenticated users (via service role in edge function)
GRANT EXECUTE ON FUNCTION public.try_deduct_credit(UUID) TO service_role;
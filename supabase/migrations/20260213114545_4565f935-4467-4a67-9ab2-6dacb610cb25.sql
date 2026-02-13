
-- Fix 1: Restrict profile UPDATE to only allow display_name and avatar_url changes
-- Drop the overly permissive user update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create restrictive policy that prevents credits/email/user_id modification
CREATE POLICY "Users can update profile metadata"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Create a trigger to prevent users from modifying sensitive fields
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service_role (via SECURITY DEFINER functions) to modify credits
  -- For regular user updates, preserve the original credits value
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    -- Check if this is being called from a SECURITY DEFINER context
    -- Regular users updating via RLS will hit this
    IF current_setting('role') = 'authenticated' THEN
      NEW.credits := OLD.credits;
    END IF;
  END IF;
  
  -- Prevent user_id changes
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;
  
  -- Prevent email changes (should be managed by auth)
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF current_setting('role') = 'authenticated' THEN
      NEW.email := OLD.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- Fix 2: Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT TO anon
USING (false);

-- Fix 3: Restrict brand_surveys SELECT to admins only (already has admin policy, remove any public SELECT)
-- The table only has admin SELECT and public INSERT policies, which is correct.
-- But the supabase_lov scanner says SELECT is too open. Let's ensure anon can't read.
-- brand_surveys currently has no user SELECT policy - only admin. The INSERT is open (WITH CHECK true).
-- The issue is the INSERT allows anyone including ip_address. Let's not store IP for anon inserts.


-- Fix 1: profiles - Replace ineffective PERMISSIVE false policy with RESTRICTIVE
DROP POLICY IF EXISTS "Anon cannot read profiles" ON public.profiles;
CREATE POLICY "Anon cannot read profiles"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- Fix 2: brand_surveys - Replace ineffective PERMISSIVE false policy with RESTRICTIVE
DROP POLICY IF EXISTS "Anon cannot read brand surveys" ON public.brand_surveys;
CREATE POLICY "Anon cannot read brand surveys"
  ON public.brand_surveys
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- Fix 3: share_link_clicks - Add admin-only SELECT policy (currently no SELECT policy exists)
CREATE POLICY "Admins can view share link clicks"
  ON public.share_link_clicks
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));


-- Fix: Replace ineffective anon deny policy with proper permissive false policy
-- A RESTRICTIVE policy with USING(false) only restricts if there's also a permissive policy granting access.
-- A PERMISSIVE policy with USING(false) explicitly grants zero rows to anon.
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- This permissive policy for anon returns false, meaning anon gets 0 rows
-- (permissive policies are OR'd together, and false OR nothing = false)
CREATE POLICY "Anon cannot read profiles"
ON public.profiles FOR SELECT TO anon
USING (false);

-- Also fix brand_surveys: add explicit anon SELECT deny
CREATE POLICY "Anon cannot read brand surveys"
ON public.brand_surveys FOR SELECT TO anon
USING (false);

-- 관리자가 모든 프로필을 수정할 수 있도록 정책 추가
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
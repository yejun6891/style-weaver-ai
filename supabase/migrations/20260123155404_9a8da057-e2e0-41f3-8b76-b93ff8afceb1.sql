-- 관리자가 모든 프로모 코드를 조회할 수 있도록 정책 추가
CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 관리자가 프로모 코드를 생성할 수 있도록 정책 추가
CREATE POLICY "Admins can create promo codes"
ON public.promo_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 관리자가 프로모 코드를 수정할 수 있도록 정책 추가
CREATE POLICY "Admins can update promo codes"
ON public.promo_codes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 관리자가 프로모 코드를 삭제할 수 있도록 정책 추가
CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 관리자가 사용자 프로모 코드 현황을 조회할 수 있도록 정책 추가
CREATE POLICY "Admins can view all user promo codes"
ON public.user_promo_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
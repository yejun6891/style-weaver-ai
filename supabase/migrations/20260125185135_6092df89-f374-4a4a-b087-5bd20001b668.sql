-- payment_logs 테이블 생성 (중복 결제 방지 및 기록용)
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_added INTEGER NOT NULL,
  lemon_order_id TEXT UNIQUE NOT NULL,
  variant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admins can view payment logs" ON public.payment_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- add_credits_admin 함수 생성 (웹훅 전용 - Service Role에서만 호출)
CREATE OR REPLACE FUNCTION public.add_credits_admin(p_user_id UUID, p_credits INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
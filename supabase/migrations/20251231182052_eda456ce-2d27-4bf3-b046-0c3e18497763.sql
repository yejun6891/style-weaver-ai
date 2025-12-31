-- 공유 링크 테이블
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  reward_given BOOLEAN NOT NULL DEFAULT false,
  reward_credits INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, task_id)
);

-- 클릭 트래킹 테이블 (중복 클릭 방지용)
CREATE TABLE public.share_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  visitor_ip TEXT,
  visitor_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_link_clicks ENABLE ROW LEVEL SECURITY;

-- share_links RLS 정책
CREATE POLICY "Users can view their own share links"
ON public.share_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share links"
ON public.share_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links"
ON public.share_links FOR UPDATE
USING (auth.uid() = user_id);

-- share_link_clicks는 Edge Function에서 service role로 처리
CREATE POLICY "Anyone can insert clicks"
ON public.share_link_clicks FOR INSERT
WITH CHECK (true);

-- 3회 클릭 시 보상 지급 함수
CREATE OR REPLACE FUNCTION public.process_share_click(p_share_code TEXT, p_visitor_fingerprint TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_link RECORD;
  v_new_click_count INTEGER;
  v_already_clicked BOOLEAN;
  v_reward_threshold INTEGER := 3;
BEGIN
  -- 공유 링크 조회
  SELECT * INTO v_share_link
  FROM public.share_links
  WHERE share_code = p_share_code;
  
  IF v_share_link IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid share code');
  END IF;
  
  -- 이미 보상 지급된 경우
  IF v_share_link.reward_given THEN
    RETURN json_build_object('success', true, 'already_rewarded', true, 'click_count', v_share_link.click_count);
  END IF;
  
  -- 중복 클릭 체크 (같은 fingerprint)
  SELECT EXISTS(
    SELECT 1 FROM public.share_link_clicks
    WHERE share_link_id = v_share_link.id
    AND visitor_fingerprint = p_visitor_fingerprint
  ) INTO v_already_clicked;
  
  IF v_already_clicked THEN
    RETURN json_build_object('success', true, 'duplicate', true, 'click_count', v_share_link.click_count);
  END IF;
  
  -- 클릭 기록 추가
  INSERT INTO public.share_link_clicks (share_link_id, visitor_fingerprint)
  VALUES (v_share_link.id, p_visitor_fingerprint);
  
  -- 클릭 수 증가
  UPDATE public.share_links
  SET click_count = click_count + 1
  WHERE id = v_share_link.id
  RETURNING click_count INTO v_new_click_count;
  
  -- 3회 도달 시 보상 지급
  IF v_new_click_count >= v_reward_threshold AND NOT v_share_link.reward_given THEN
    -- 보상 지급 표시
    UPDATE public.share_links
    SET reward_given = true, rewarded_at = now()
    WHERE id = v_share_link.id;
    
    -- 이용권 추가
    UPDATE public.profiles
    SET credits = credits + v_share_link.reward_credits,
        updated_at = now()
    WHERE user_id = v_share_link.user_id;
    
    RETURN json_build_object(
      'success', true, 
      'click_count', v_new_click_count, 
      'reward_given', true,
      'credits_added', v_share_link.reward_credits
    );
  END IF;
  
  RETURN json_build_object('success', true, 'click_count', v_new_click_count, 'reward_given', false);
END;
$$;

-- 인덱스 추가
CREATE INDEX idx_share_links_share_code ON public.share_links(share_code);
CREATE INDEX idx_share_links_user_task ON public.share_links(user_id, task_id);
CREATE INDEX idx_share_link_clicks_fingerprint ON public.share_link_clicks(share_link_id, visitor_fingerprint);
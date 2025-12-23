-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'credits')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase NUMERIC DEFAULT NULL,
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_promo_codes table (user's claimed promo codes)
CREATE TABLE public.user_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes (public read for active codes)
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- RLS policies for user_promo_codes
CREATE POLICY "Users can view their own promo codes"
ON public.user_promo_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can claim promo codes"
ON public.user_promo_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promo codes"
ON public.user_promo_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX idx_user_promo_codes_user ON public.user_promo_codes(user_id);
CREATE INDEX idx_user_promo_codes_promo ON public.user_promo_codes(promo_code_id);

-- Function to increment promo usage count
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_promo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = p_promo_id;
END;
$$;

-- Function to add credits to user
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_credits integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Insert some sample promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, per_user_limit, is_active) VALUES
('WELCOME20', 'percentage', 20, 1, true),
('FIRST10', 'fixed', 1, 1, true),
('BONUS5', 'credits', 5, 1, true);
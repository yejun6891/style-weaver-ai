-- Create brand_surveys table to store user brand preferences
CREATE TABLE public.brand_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  favorite_brands TEXT[] NOT NULL DEFAULT '{}',
  other_brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT
);

-- Enable Row Level Security
ALTER TABLE public.brand_surveys ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create survey responses (anonymous allowed)
CREATE POLICY "Anyone can submit surveys" 
ON public.brand_surveys 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all survey responses
CREATE POLICY "Admins can view all surveys" 
ON public.brand_surveys 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster admin queries
CREATE INDEX idx_brand_surveys_created_at ON public.brand_surveys(created_at DESC);
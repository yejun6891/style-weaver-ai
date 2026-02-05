-- Create visitor_logs table to track page visits
CREATE TABLE public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '/',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

-- Enable Row Level Security
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (for anonymous visitors)
CREATE POLICY "Anyone can log visits" 
ON public.visitor_logs 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view visitor logs
CREATE POLICY "Admins can view all visitor logs" 
ON public.visitor_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient date-based queries
CREATE INDEX idx_visitor_logs_created_at ON public.visitor_logs(created_at DESC);
CREATE INDEX idx_visitor_logs_session_page ON public.visitor_logs(session_id, page_path);
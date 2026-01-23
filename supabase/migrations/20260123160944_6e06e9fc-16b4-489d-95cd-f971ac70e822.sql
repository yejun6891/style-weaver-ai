-- Create feedback_tickets table
CREATE TABLE public.feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'inquiry', 'other')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feedback_attachments table
CREATE TABLE public.feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feedback_replies table
CREATE TABLE public.feedback_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback_tickets
CREATE POLICY "Users can create their own tickets"
  ON public.feedback_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
  ON public.feedback_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.feedback_tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
  ON public.feedback_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for feedback_attachments
CREATE POLICY "Users can create attachments for their tickets"
  ON public.feedback_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.feedback_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view attachments of their tickets"
  ON public.feedback_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.feedback_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all attachments"
  ON public.feedback_attachments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for feedback_replies
CREATE POLICY "Users can create replies on their tickets"
  ON public.feedback_replies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.feedback_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view replies on their tickets"
  ON public.feedback_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.feedback_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all replies"
  ON public.feedback_replies FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for feedback_tickets
CREATE TRIGGER update_feedback_tickets_updated_at
  BEFORE UPDATE ON public.feedback_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-attachments', 'feedback-attachments', true);

-- Storage policies for feedback-attachments bucket
CREATE POLICY "Authenticated users can upload feedback attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feedback-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view feedback attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-attachments');

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feedback-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Create task_ownership table to track task ownership
CREATE TABLE public.task_ownership (
  task_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_ownership ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tasks
CREATE POLICY "Users can view their own tasks"
ON public.task_ownership FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
ON public.task_ownership FOR INSERT
WITH CHECK (auth.uid() = user_id);
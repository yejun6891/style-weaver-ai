-- Add task_id column to usage_history for result re-viewing
ALTER TABLE public.usage_history 
ADD COLUMN IF NOT EXISTS task_id text;

-- Create index for efficient querying by user_id and task_id
CREATE INDEX IF NOT EXISTS idx_usage_history_user_task ON public.usage_history(user_id, task_id);

-- Create index for ordering by created_at for cleanup
CREATE INDEX IF NOT EXISTS idx_usage_history_user_created ON public.usage_history(user_id, created_at DESC);
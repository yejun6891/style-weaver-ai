-- Add DELETE policy to allow users to delete their own usage history
CREATE POLICY "Users can delete their own usage history"
ON public.usage_history FOR DELETE
USING (auth.uid() = user_id);
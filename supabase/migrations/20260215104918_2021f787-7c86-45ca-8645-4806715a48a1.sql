
-- Make the feedback-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'feedback-attachments';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view feedback attachments" ON storage.objects;

-- Create restricted SELECT policy: ticket owner or admin only
CREATE POLICY "Users can view own ticket attachments or admin"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'feedback-attachments' AND
  (
    -- File path starts with user's own folder
    auth.uid()::text = (string_to_array(name, '/'))[1]
    OR
    -- Admin can view all
    public.has_role(auth.uid(), 'admin')
  )
);

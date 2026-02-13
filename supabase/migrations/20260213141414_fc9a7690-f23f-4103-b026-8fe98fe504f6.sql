-- Add terms_agreed_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN terms_agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
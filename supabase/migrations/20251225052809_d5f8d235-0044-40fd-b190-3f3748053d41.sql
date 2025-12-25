-- Change default credits from 5 to 1 for new users
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 1;
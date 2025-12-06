-- Add new columns to listings table for enhanced features
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS images text[]; -- Array of image URLs

-- Add new columns to profiles if needed (phone is usually in auth.users but good to have in profile for display if public)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update the storage policies to allow video uploads if needed (assuming 'listings' bucket handles all)
-- The existing policy allows all inserts to 'listings' bucket for authenticated users, so it should cover videos too.

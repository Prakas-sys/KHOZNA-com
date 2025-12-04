-- ================================================
-- FIX FOR PROPERTY POSTING FETCH FAILURE
-- ================================================
-- This script adds missing columns to the listings table
-- that are required for posting properties with multiple images and videos.

-- 1. Add missing columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS images text[]; -- Array of image URLs

-- 2. Verify the columns exist
DO $$
BEGIN
    -- Check if video_url exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'listings' 
        AND column_name = 'video_url'
    ) THEN
        RAISE NOTICE '✅ video_url column exists';
    ELSE
        RAISE EXCEPTION '❌ video_url column missing';
    END IF;

    -- Check if images exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'listings' 
        AND column_name = 'images'
    ) THEN
        RAISE NOTICE '✅ images column exists';
    ELSE
        RAISE EXCEPTION '❌ images column missing';
    END IF;
END $$;

-- 3. Refresh the RLS policies (just to be safe)
-- Drop and recreate the insert policy to ensure it works with new columns
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;

CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 4. Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'listings'
ORDER BY ordinal_position;

RAISE NOTICE '✅ Database schema updated successfully!';
RAISE NOTICE '⚠️ Now check your Supabase environment variables in .env file';

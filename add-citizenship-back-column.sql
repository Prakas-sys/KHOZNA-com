-- Add missing citizenship_photo_back_url column to kyc_verifications table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.kyc_verifications 
ADD COLUMN IF NOT EXISTS citizenship_photo_back_url text;

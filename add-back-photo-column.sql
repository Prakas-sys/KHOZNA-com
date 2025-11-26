-- Add back side photo column to kyc_verifications table
ALTER TABLE public.kyc_verifications 
ADD COLUMN IF NOT EXISTS citizenship_photo_back_url text;

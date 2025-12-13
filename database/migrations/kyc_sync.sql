-- kyc_sync.sql
-- Run in Supabase SQL editor as project admin.
-- 1) Ensure `is_verified` column exists on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2) Mark profiles verified for already-approved KYC rows
UPDATE public.profiles p
SET is_verified = true
FROM public.kyc_verifications k
WHERE p.id = k.user_id
  AND (k.status = 'approved' OR k.status = 'verified');

-- Optional: show count of updated profiles
SELECT count(*) AS verified_profiles FROM public.profiles WHERE is_verified = true;

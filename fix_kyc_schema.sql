-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Drop the old table (this removes the old schema causing the error)
DROP TABLE IF EXISTS public.kyc_verifications;

-- 2. Re-create the table with user_id as PRIMARY KEY
CREATE TABLE public.kyc_verifications (
  user_id uuid PRIMARY KEY REFERENCES auth.users NOT NULL,
  citizenship_photo_url text,
  citizenship_photo_back_url text,
  citizenship_number text,
  phone_number text,
  otp_code text,
  otp_expires_at timestamp with time zone,
  status text DEFAULT 'pending',
  rejection_reason text,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at timestamp with time zone,
  verified_by uuid REFERENCES auth.users
);

-- 3. Re-enable Security
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies
CREATE POLICY "Users can view own KYC"
  ON kyc_verifications FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can submit own KYC"
  ON kyc_verifications FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own KYC"
  ON kyc_verifications FOR UPDATE
  USING ( auth.uid() = user_id );

-- Quick setup script to create KYC storage bucket and policies
-- Run this in Supabase SQL Editor

-- Create storage bucket for KYC documents (private for security)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can view own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can update own KYC documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

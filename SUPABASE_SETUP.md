# Supabase Setup Guide for KHOZNA

This guide will help you set up the required Supabase storage bucket for KYC document uploads.

## Storage Bucket Setup

### 1. Create the KYC Documents Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your KHOZNA project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `kyc-documents`
   - **Public bucket**: ✅ **Enable** (so documents can be accessed via public URLs)
   - **File size limit**: 5 MB (optional, for security)
   - **Allowed MIME types**: `image/*` (optional, for security)

6. Click **Create bucket**

### 2. Set Up Storage Policies (Security)

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. In the Storage section, click on the `kyc-documents` bucket
2. Go to the **Policies** tab
3. Click **New Policy**

#### Policy 1: Allow Authenticated Users to Upload Their Own Documents

```sql
-- Policy Name: Users can upload their own KYC documents
-- Operation: INSERT
-- Policy Definition:
(bucket_id = 'kyc-documents'::text) 
AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 2: Allow Authenticated Users to Read Their Own Documents

```sql
-- Policy Name: Users can view their own KYC documents
-- Operation: SELECT
-- Policy Definition:
(bucket_id = 'kyc-documents'::text) 
AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 3: Allow Authenticated Users to Update Their Own Documents

```sql
-- Policy Name: Users can update their own KYC documents
-- Operation: UPDATE
-- Policy Definition:
(bucket_id = 'kyc-documents'::text) 
AND (auth.uid()::text = (storage.foldername(name))[1])
```

### 3. Verify Setup

After setting up the bucket and policies:

1. Try uploading a KYC document through the KHOZNA app
2. The error "no bucket found" should be resolved
3. Documents should be stored in the format: `kyc-documents/{user_id}/citizenship.{ext}`

## Troubleshooting

### Error: "no bucket found"
- **Cause**: The `kyc-documents` bucket doesn't exist
- **Solution**: Follow Step 1 above to create the bucket

### Error: "new row violates row-level security policy"
- **Cause**: Storage policies are not set up correctly
- **Solution**: Follow Step 2 above to add the necessary policies

### Error: "File size too large"
- **Cause**: File exceeds 5MB limit
- **Solution**: This is handled in the app, but you can adjust the bucket's file size limit if needed

## Database Tables

Make sure you also have the `kyc_verifications` table created:

```sql
CREATE TABLE kyc_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  citizenship_photo_url TEXT,
  citizenship_number TEXT,
  phone_number TEXT,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own KYC verification
CREATE POLICY "Users can view own KYC" ON kyc_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own KYC verification
CREATE POLICY "Users can insert own KYC" ON kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own KYC verification
CREATE POLICY "Users can update own KYC" ON kyc_verifications
  FOR UPDATE USING (auth.uid() = user_id);
```

# KYC Storage Bucket Setup Instructions

## Quick Setup (3 minutes)

The storage bucket and policies can be created by running SQL commands in your Supabase dashboard.

### Option 1: Run the Quick Setup Script (Recommended)

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard
   - Select your KHOZNA project
   - Click **SQL Editor** in the left sidebar

2. **Run the Setup Script**
   - Click **New Query**
   - Copy and paste the contents of `setup-kyc-storage.sql`
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Success**
   - You should see a result showing the `kyc-documents` bucket
   - Check the Storage section to confirm the bucket exists

### Option 2: Run the Full Schema

If you haven't run the full schema yet:

1. Open Supabase SQL Editor
2. Copy and paste the contents of `schema.sql`
3. Click **Run**

This will create all tables, policies, and storage buckets including the KYC infrastructure.

## What Gets Created

✅ **Storage Bucket**: `kyc-documents` (private)
✅ **INSERT Policy**: Users can upload to their own folder
✅ **SELECT Policy**: Users can view their own documents
✅ **UPDATE Policy**: Users can update their own documents

## File Structure

Documents will be stored as:
```
kyc-documents/
└── {user_id}/
    └── citizenship.{ext}
```

## After Setup

Once the SQL runs successfully:

1. The "Bucket not found" error will be resolved
2. Users can upload KYC documents
3. Documents are securely stored (only accessible by the owner)
4. Ready to test the complete KYC flow!

## Testing

Run the development server and test:
```bash
npm run dev
```

Then try uploading a KYC document through the app.

## Troubleshooting

**If you get "policy already exists" errors:**
- This is normal if you've run the script before
- The bucket and policies are already set up
- You can proceed to testing

**If the bucket still doesn't exist:**
- Check that you're in the correct Supabase project
- Verify the SQL ran without errors
- Check the Storage section in Supabase dashboard

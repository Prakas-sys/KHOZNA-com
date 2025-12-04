# 🔧 Property Posting Fix Guide

## Problem
When clicking "Post" after filling out the property form, you get a **"fetch failed"** error.

## Root Causes
1. ❌ Missing `images` and `video_url` columns in the `listings` table
2. ❌ KYC table returning 406 error (blocking verification)
3. ⚠️ Possible environment variable issues

---

## ✅ SOLUTION

### Step 1: Update Supabase Database Schema

**Option A: Via Supabase Dashboard** (RECOMMENDED)
1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Run this query:

```sql
-- Add missing columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS images text[];

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'listings';
```

**Option B: Run the Fix Script**
Execute the `FIX_POSTING_ISSUE.sql` file in Supabase SQL Editor.

---

### Step 2: Fix KYC 406 Error

The 406 error suggests an issue with the Accept headers or table structure. Run this in Supabase:

```sql
-- Check if the table exists and is accessible
SELECT * FROM public.kyc_verifications LIMIT 1;

-- If no error, the table is fine. If error, you may need to check RLS policies
-- Temporarily disable RLS to test (ONLY FOR DEBUGGING)
-- ALTER TABLE public.kyc_verifications DISABLE ROW LEVEL SECURITY;

-- Better: Ensure the SELECT policy exists
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;

CREATE POLICY "Users can view own KYC"
  ON kyc_verifications FOR SELECT
  USING ( auth.uid() = user_id );
```

---

### Step 3: Verify Environment Variables

Check that your `.env` file has valid Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

**To find your credentials:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy **Project URL** → Paste as `VITE_SUPABASE_URL`
3. Copy **anon/public key** → Paste as `VITE_SUPABASE_ANON_KEY`

---

### Step 4: Restart Dev Server

After making changes:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 🧪 Testing the Fix

1. **Log in** to your app
2. **Complete KYC verification** (if not already verified)
3. **Click "Post Property"** button
4. **Fill out the form** with:
   - Title
   - Location
   - Price
   - At least 1 image
5. **Click "Post"**
6. **Check browser console** (F12) for any errors

---

## 📊 Expected Console Output (Success)

```
✅ Listings fetched & enriched: X
Latest listing: { title: "Your Property Title", ... }
```

---

## ❌ If Still Failing

### Check Browser Console for:
- **401 Unauthorized** → Environment variables wrong
- **403 Forbidden** → RLS policy issue
- **404 Not Found** → Storage bucket 'listings' not created
- **406 Not Acceptable** → Content type mismatch (KYC table issue)
- **500 Server Error** → Database schema mismatch

### Common Fixes:
1. **Clear browser cache** and reload
2. **Check Supabase Storage** → Ensure `listings` bucket exists
3. **Verify RLS policies** are active
4. **Check console** for the EXACT error message

---

## 📝 Summary

**The issue is NOT in App.jsx!** ✅

The problem is in the **database schema** missing columns that your frontend expects.

Run the SQL migration → Restart server → Test posting.

---

## Need More Help?

Share the exact error message from the browser console (F12 → Console tab).

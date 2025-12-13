-- ================================================
-- SUPABASE STORAGE BUCKET SETUP FOR FILE SHARING
-- ================================================

-- 1. Create storage buckets used by the app
INSERT INTO storage.buckets (id, name, "public")
VALUES
    ('attachments', 'attachments', true),
    ('kyc-documents', 'kyc-documents', false),
    ('listings', 'listings', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies: allow authenticated users to upload/view appropriate buckets
-- Policy for attachments (chat files)
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Users can view their conversation attachments" ON storage.objects;
CREATE POLICY "Users can view their conversation attachments"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'attachments'
    );

DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
CREATE POLICY "Users can delete their own attachments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'attachments'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM conversations
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

-- Policy for KYC documents (private by default)
DROP POLICY IF EXISTS "Auth upload kyc" ON storage.objects;
CREATE POLICY "Auth upload kyc"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'kyc-documents' AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Auth view kyc" ON storage.objects;
CREATE POLICY "Auth view kyc"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'kyc-documents'
    );

-- Policy for listings (images/videos)
DROP POLICY IF EXISTS "Auth upload listings" ON storage.objects;
CREATE POLICY "Auth upload listings"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'listings' AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Auth view listings" ON storage.objects;
CREATE POLICY "Auth view listings"
    ON storage.objects FOR SELECT
    TO public
    USING (
        bucket_id = 'listings'
    );

-- Policy for avatars
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Auth view avatars" ON storage.objects;
CREATE POLICY "Auth view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (
        bucket_id = 'avatars'
    );

-- Storage bucket and policies setup complete.

-- ================================================
-- SUPABASE STORAGE BUCKET SETUP FOR FILE SHARING
-- ================================================

-- 1. CREATE STORAGE BUCKET FOR CHAT ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SETUP STORAGE POLICIES FOR ATTACHMENTS BUCKET

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attachments' 
    AND auth.uid() IS NOT NULL
);

-- Allow users to view attachments in their conversations
CREATE POLICY "Users can view their conversation attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'attachments'
);

-- Allow users to delete their own uploads
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

-- ✅ Storage bucket setup complete!
-- Users can now upload and share images, PDFs, and documents in chat.

-- Fix message read/unread functionality
-- Run this in Supabase SQL Editor

-- 1. First, let's manually mark all your current messages as read (temporary fix)
-- Replace 'YOUR_USER_ID' with your actual user ID
UPDATE messages 
SET is_read = true 
WHERE sender_id != 'YOUR_USER_ID';

-- 2. Verify RLS policies allow updating is_read field
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- 3. Ensure UPDATE permission is granted
GRANT UPDATE ON messages TO authenticated;

-- 4. Make sure the RLS policy for messages allows updates
-- If the policy is too restrictive, drop and recreate it
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

CREATE POLICY "Users can update messages in their conversations"
ON messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
);

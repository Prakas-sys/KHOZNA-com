-- Add missing columns to messages table for ChatModal.jsx features

-- 1. Add reply_to_id
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id);

-- 2. Add attachment columns
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text,
ADD COLUMN IF NOT EXISTS attachment_name text;

-- 3. Add edited_at column (if not exists)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;

-- 4. Create index for reply_to_id
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

-- 5. Update RLS to allow inserting these new columns
-- (The existing INSERT policy should cover new columns if it's just checking sender_id and conversation membership)
-- But let's ensure the policy is permissive enough.

-- Re-apply the INSERT policy just in case
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
    );

-- 6. Add policy for updating messages (editing)
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
CREATE POLICY "Users can edit their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

/* Add missing columns to messages table */

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id);

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url text;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_type text;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_name text;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

/* Update RLS Policies */

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

DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
CREATE POLICY "Users can edit their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

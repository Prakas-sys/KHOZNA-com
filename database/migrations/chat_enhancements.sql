-- ================================================
-- PREMIUM CHAT ENHANCEMENTS - 100% FREE!
-- ================================================

-- 1. ADD REACTIONS SUPPORT TO MESSAGES
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    reaction text NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'sad', 'angry', 'wow')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id, reaction)
);

-- 2. ADD EDIT/DELETE TRACKING TO MESSAGES
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 3. ADD FILE ATTACHMENT SUPPORT
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text,
ADD COLUMN IF NOT EXISTS attachment_name text;

-- 4. ADD MESSAGE STATUS TRACKING
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- 5. ADD REPLY/THREAD SUPPORT
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_attachment ON messages(attachment_url) WHERE attachment_url IS NOT NULL;

-- 7. ENABLE ROW LEVEL SECURITY FOR REACTIONS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR REACTIONS
DROP POLICY IF EXISTS "Users can view reactions in their conversations" ON message_reactions;
CREATE POLICY "Users can view reactions in their conversations"
    ON message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = message_reactions.message_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON message_reactions;
CREATE POLICY "Users can remove their reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- 9. ENABLE REALTIME FOR REACTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- 10. CREATE FUNCTION TO UPDATE MESSAGE READ STATUS
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET read_at = now()
    WHERE conversation_id = conversation_uuid
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. CREATE FUNCTION TO GET UNREAD COUNT
CREATE OR REPLACE FUNCTION get_unread_count(conversation_uuid uuid)
RETURNS integer AS $$
    SELECT COUNT(*)::integer
    FROM messages
    WHERE conversation_id = conversation_uuid
    AND sender_id != auth.uid()
    AND read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- 12. CREATE VIEW FOR MESSAGE WITH REACTIONS
CREATE OR REPLACE VIEW messages_with_reactions AS
SELECT 
    m.*,
    COALESCE(
        json_agg(
            json_build_object(
                'reaction', mr.reaction,
                'user_id', mr.user_id,
                'created_at', mr.created_at
            )
        ) FILTER (WHERE mr.id IS NOT NULL),
        '[]'
    ) as reactions
FROM messages m
LEFT JOIN message_reactions mr ON m.id = mr.message_id
GROUP BY m.id;

-- 13. UPDATE POLICIES TO ALLOW MESSAGE EDITING
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- 14. CREATE NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
    sound_enabled boolean DEFAULT true,
    notifications_enabled boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
    ON notification_preferences
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ✅ ENHANCEMENTS COMPLETE!
-- All features are ready to use! 🎉

COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';
COMMENT ON TABLE notification_preferences IS 'User preferences for notifications and sounds';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marks all unread messages in a conversation as read';
COMMENT ON FUNCTION get_unread_count IS 'Returns count of unread messages in a conversation';

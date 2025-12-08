-- FINAL PERMISSION FIX
-- Run this in Supabase SQL Editor to fix "permission denied for table conversations" (Error 42501)

-- 1. Grant usage and access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE conversations TO authenticated;
GRANT ALL ON TABLE messages TO authenticated;

-- 2. Make sure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL OLD POLICIES (To prevent conflicts)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Enable access to own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Enable access to messages in own conversations" ON messages;

-- 4. CREATE NEW SIMPLIFIED POLICIES

-- Conversations: Allow everything if you are a participant
CREATE POLICY "Enable access to own conversations"
ON conversations FOR ALL
USING (
  auth.uid() = participant_1_id OR 
  auth.uid() = participant_2_id
)
WITH CHECK (
  auth.uid() = participant_1_id OR 
  auth.uid() = participant_2_id
);

-- Messages: Allow viewing if in conversation, Allow inserting if sender
CREATE POLICY "Enable access to messages in own conversations"
ON messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() = sender_id
);

-- 5. Force Realtime Repliation (Just in case)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

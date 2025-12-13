-- Combined, idempotent migration for Khozna app
-- Run this in Supabase SQL editor as a project admin.
-- It creates tables, RLS policies, storage buckets, triggers, and publication settings.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================
-- Profiles
-- ================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  full_name text,
  email text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes
-- Ensure `username` column exists (safe when importing into an existing DB)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ================================
-- Listings
-- ================================
CREATE TABLE IF NOT EXISTS public.listings (
  id bigserial PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(12,2),
  images jsonb,
  location jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);

-- ================================
-- Notifications
-- ================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  metadata jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ================================
-- KYC verifications
-- ================================
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  document_url text,
  provider_response jsonb,
  reviewed_by uuid,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON public.kyc_verifications(user_id);

-- ================================
-- Edit requests / Reports / Reservations
-- ================================
CREATE TABLE IF NOT EXISTS public.edit_requests (
  id bigserial PRIMARY KEY,
  listing_id bigint REFERENCES public.listings(id) ON DELETE CASCADE,
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reports (
  id bigserial PRIMARY KEY,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id bigserial PRIMARY KEY,
  listing_id bigint REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- ================================
-- Conversations & Messages (Chat)
-- ================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id bigint REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) NOT NULL,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  content text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  reply_to_id uuid REFERENCES public.messages(id),
  attachment_url text,
  attachment_type text,
  attachment_name text,
  edited_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- Trigger function to update conversation timestamp on new messages
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON public.messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- ================================
-- Row Level Security (RLS) and Policies
-- ================================
-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversations_select_policy ON public.conversations;
CREATE POLICY conversations_select_policy ON public.conversations
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS conversations_insert_policy ON public.conversations;
CREATE POLICY conversations_insert_policy ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_update_policy ON public.messages;
CREATE POLICY messages_update_policy ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Listings RLS (basic example)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS listings_owner_policy ON public.listings;
CREATE POLICY listings_owner_policy ON public.listings
  FOR ALL
  USING (true)
  WITH CHECK (auth.uid() = owner_id);

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- KYC RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kyc_select_policy ON public.kyc_verifications;
CREATE POLICY kyc_select_policy ON public.kyc_verifications
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS kyc_insert_policy ON public.kyc_verifications;
CREATE POLICY kyc_insert_policy ON public.kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- Storage buckets (Supabase storage)
-- Note: running INSERT into storage.buckets requires project admin / service role
-- ================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'kyc-documents') THEN
    INSERT INTO storage.buckets (id, name, owner, public, metadata)
    VALUES (gen_random_uuid(), 'kyc-documents', 'project', false, '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'listings') THEN
    INSERT INTO storage.buckets (id, name, owner, public, metadata)
    VALUES (gen_random_uuid(), 'listings', 'project', true, '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, owner, public, metadata)
    VALUES (gen_random_uuid(), 'avatars', 'project', true, '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'attachments') THEN
    INSERT INTO storage.buckets (id, name, owner, public, metadata)
    VALUES (gen_random_uuid(), 'attachments', 'project', false, '{}');
  END IF;
END$$;

-- Storage policies: allow owners to upload their files to their buckets
-- These require the "storage" schema and policies; adjust as needed in Supabase UI

-- ================================
-- Realtime publication (supabase_realtime)
-- Note: these statements may require superuser or specific publication setup; run only if your project supports it
-- ================================
DO $$
BEGIN
  -- Add messages and conversations to the realtime publication if publication exists
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.messages;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.conversations;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_table OR undefined_table THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_table OR undefined_table THEN
      NULL;
    END;
  END IF;
END$$;

-- ================================
-- Final housekeeping: update timestamps on update
-- ================================
CREATE OR REPLACE FUNCTION public.updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at trigger to tables that have updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.updated_at_trigger();

DROP TRIGGER IF EXISTS set_updated_at_listings ON public.listings;
CREATE TRIGGER set_updated_at_listings BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.updated_at_trigger();

DROP TRIGGER IF EXISTS set_updated_at_kyc ON public.kyc_verifications;
CREATE TRIGGER set_updated_at_kyc BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW EXECUTE FUNCTION public.updated_at_trigger();

-- Done. After running this script:
-- 1) Verify storage buckets in Supabase UI
-- 2) Run app tests (KYC flow, create listing, chat messaging)
-- 3) If you get SQL errors, copy them here and I will iterate.

-- End of combined_migration.sql

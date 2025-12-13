-- Storage-only SQL: create expected buckets if missing
-- Run this in the Supabase SQL editor as a project admin (no DO block)

-- Some Supabase projects have a different `storage.buckets` schema (no `metadata` column).
-- Use minimal, widely-supported columns to insert buckets safely.
-- Attempt to insert buckets in a way that adapts to different storage.buckets schemas.
-- The code below checks the `owner` column type and nullability and chooses a safe value.

DO $$
DECLARE
	owner_data_type text;
	owner_is_nullable text;
	use_owner text;
	sql text;
BEGIN
	SELECT data_type, is_nullable
		INTO owner_data_type, owner_is_nullable
	FROM information_schema.columns
	WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'owner';

	-- Decide what to insert into owner column:
	-- - if owner column is uuid and nullable => use NULL
	-- - if owner column is uuid and NOT nullable => use gen_random_uuid()
	-- - otherwise (text or other) => use literal 'project'
	IF owner_data_type = 'uuid' THEN
		IF owner_is_nullable = 'YES' THEN
			use_owner := 'NULL';
		ELSE
			use_owner := 'gen_random_uuid()';
		END IF;
	ELSE
		use_owner := quote_literal('project');
	END IF;

	-- Helper to insert a bucket if missing using the computed owner expression
	sql := format($f$
		INSERT INTO storage.buckets (id, name, owner, public)
		SELECT gen_random_uuid(), %L, %s, %s
		WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = %L);
	$f$, 'kyc-documents', use_owner, 'false', 'kyc-documents');
	EXECUTE sql;

	sql := format($f$
		INSERT INTO storage.buckets (id, name, owner, public)
		SELECT gen_random_uuid(), %L, %s, %s
		WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = %L);
	$f$, 'listings', use_owner, 'true', 'listings');
	EXECUTE sql;

	sql := format($f$
		INSERT INTO storage.buckets (id, name, owner, public)
		SELECT gen_random_uuid(), %L, %s, %s
		WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = %L);
	$f$, 'avatars', use_owner, 'true', 'avatars');
	EXECUTE sql;

	sql := format($f$
		INSERT INTO storage.buckets (id, name, owner, public)
		SELECT gen_random_uuid(), %L, %s, %s
		WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = %L);
	$f$, 'attachments', use_owner, 'false', 'attachments');
	EXECUTE sql;
END$$ LANGUAGE plpgsql;

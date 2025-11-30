# Setup Avatars Bucket

To enable profile picture uploads, you need to create the `avatars` storage bucket in Supabase.

I have created a SQL script `setup_avatars_bucket.sql` that does this for you.

## How to run the script

1.  Go to your Supabase Dashboard.
2.  Navigate to the **SQL Editor**.
3.  Create a new query.
4.  Copy the contents of `setup_avatars_bucket.sql` and paste it into the query editor.
5.  Click **Run**.

Alternatively, if you have the Supabase CLI configured locally, you can run:

```bash
supabase db reset
```
(Warning: This will reset your database)

Or if you have `psql` installed and connected:

```bash
psql "your_connection_string" -f setup_avatars_bucket.sql
```

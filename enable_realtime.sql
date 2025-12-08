-- RUN THIS IN SUPABASE SQL EDITOR

-- Enable Realtime for 'messages' table
-- This allows the app to instantly receive new messages without reloading.
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, conversations;
commit;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

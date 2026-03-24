-- -------------------------------------------------------------
-- FEATURE: ENABLE REALTIME FOR CHAT MESSAGES
-- -------------------------------------------------------------

-- Supabase handles realtime primarily through logical replication publication 'supabase_realtime'
-- We must explicitly add tables we want to receive realtime broadcast changes for.

-- First check if the publication exists (it does by default on Supabase, but safe to check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add the messages table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- Add the chat_rooms to realtime as well so we can track status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

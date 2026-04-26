-- Migration: Advanced Messaging Features (Items 5-11)
-- Features: Threaded replies, voice messages, message drafts, scheduled messages, pinned messages

-- 1. Add threaded replies support to direct_messages
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add index for reply queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON direct_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_direct_messages_pinned ON direct_messages(is_pinned, pinned_at) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_direct_messages_scheduled ON direct_messages(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- 2. Add threaded replies support to group_messages
ALTER TABLE group_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES group_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add index for reply queries
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON group_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_messages_pinned ON group_messages(is_pinned, pinned_at) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_group_messages_scheduled ON group_messages(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- 3. Create message drafts table
CREATE TABLE IF NOT EXISTS message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL, -- Can be group_id or receiver_id
  chat_type TEXT NOT NULL CHECK (chat_type IN ('group', 'dm')),
  content TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chat_id, chat_type)
);

-- Enable RLS on drafts
ALTER TABLE message_drafts ENABLE ROW LEVEL SECURITY;

-- Drafts policies
CREATE POLICY "Users can view own drafts" ON message_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts" ON message_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON message_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON message_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Create video calls table
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'rejected')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  call_type TEXT NOT NULL CHECK (call_type IN ('video', 'audio')),
  room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on video_calls
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

-- Video calls policies
CREATE POLICY "Users can view own calls" ON video_calls
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls" ON video_calls
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update calls" ON video_calls
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Add storage bucket for voice messages
-- Note: Run this in Supabase Dashboard Storage section
-- Bucket name: voice-messages
-- Public: false
-- Allowed MIME types: audio/webm, audio/mp3, audio/wav, audio/ogg

-- Update realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE message_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;

-- Comments for documentation
COMMENT ON COLUMN direct_messages.reply_to_id IS 'Reference to parent message for threading';
COMMENT ON COLUMN direct_messages.audio_url IS 'Voice message audio file URL';
COMMENT ON COLUMN direct_messages.is_pinned IS 'Whether message is pinned in chat';
COMMENT ON COLUMN direct_messages.scheduled_for IS 'When to send the scheduled message';
COMMENT ON TABLE message_drafts IS 'Unsent message drafts per user per chat';
COMMENT ON TABLE video_calls IS 'Video/audio call records with WebRTC room URLs';

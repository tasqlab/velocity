-- Create reactions table for message reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policies for reactions
CREATE POLICY "Users can view all reactions" 
  ON reactions FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can add reactions" 
  ON reactions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
  ON reactions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- Storage bucket for attachments (run in Supabase dashboard SQL editor)
-- Note: Create 'chat-attachments' bucket manually in Supabase Storage dashboard
-- with public access and 50MB file size limit

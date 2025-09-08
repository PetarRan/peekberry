-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create screenshots table
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR NOT NULL,
  filename VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  page_url VARCHAR NOT NULL,
  page_title VARCHAR,
  edit_count INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user statistics table
CREATE TABLE user_stats (
  clerk_user_id VARCHAR PRIMARY KEY,
  edits_this_month INTEGER DEFAULT 0,
  screenshots_this_month INTEGER DEFAULT 0,
  total_edits INTEGER DEFAULT 0,
  total_screenshots INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_screenshots_clerk_user_id ON screenshots(clerk_user_id);
CREATE INDEX idx_screenshots_created_at ON screenshots(created_at DESC);
CREATE INDEX idx_user_stats_last_activity ON user_stats(last_activity DESC);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);

-- Set up Row Level Security (RLS) policies
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Screenshots policies
CREATE POLICY "Users can view their own screenshots" ON screenshots
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own screenshots" ON screenshots
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own screenshots" ON screenshots
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own screenshots" ON screenshots
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- User stats policies
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Storage policies for screenshots bucket
CREATE POLICY "Users can view their own screenshot files" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots' AND auth.jwt() ->> 'sub' = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own screenshot files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.jwt() ->> 'sub' = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own screenshot files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'screenshots' AND auth.jwt() ->> 'sub' = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own screenshot files" ON storage.objects
  FOR DELETE USING (bucket_id = 'screenshots' AND auth.jwt() ->> 'sub' = (storage.foldername(name))[1]);

-- Create RPC functions for atomic counter updates
CREATE OR REPLACE FUNCTION increment_edit_count(user_id VARCHAR)
RETURNS TABLE(
  clerk_user_id VARCHAR,
  edits_this_month INTEGER,
  screenshots_this_month INTEGER,
  total_edits INTEGER,
  total_screenshots INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user stats record exists
  INSERT INTO user_stats (clerk_user_id) 
  VALUES (user_id) 
  ON CONFLICT (clerk_user_id) DO NOTHING;
  
  -- Update counters atomically
  UPDATE user_stats 
  SET 
    edits_this_month = edits_this_month + 1,
    total_edits = total_edits + 1,
    last_activity = NOW(),
    updated_at = NOW()
  WHERE user_stats.clerk_user_id = user_id;
  
  -- Return updated record
  RETURN QUERY
  SELECT * FROM user_stats WHERE user_stats.clerk_user_id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_screenshot_count(user_id VARCHAR)
RETURNS TABLE(
  clerk_user_id VARCHAR,
  edits_this_month INTEGER,
  screenshots_this_month INTEGER,
  total_edits INTEGER,
  total_screenshots INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user stats record exists
  INSERT INTO user_stats (clerk_user_id) 
  VALUES (user_id) 
  ON CONFLICT (clerk_user_id) DO NOTHING;
  
  -- Update counters atomically
  UPDATE user_stats 
  SET 
    screenshots_this_month = screenshots_this_month + 1,
    total_screenshots = total_screenshots + 1,
    last_activity = NOW(),
    updated_at = NOW()
  WHERE user_stats.clerk_user_id = user_id;
  
  -- Return updated record
  RETURN QUERY
  SELECT * FROM user_stats WHERE user_stats.clerk_user_id = user_id;
END;
$$;
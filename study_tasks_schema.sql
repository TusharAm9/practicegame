-- SQL Create Table for Study Plan
CREATE TABLE IF NOT EXISTS study_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own study tasks"
ON study_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study tasks"
ON study_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study tasks"
ON study_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study tasks"
ON study_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Create edit_requests table for tracking KYC edit requests
CREATE TABLE IF NOT EXISTS edit_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  citizenship_number TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_at TIMESTAMP,
  reviewed_by_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE edit_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own edit requests
CREATE POLICY "Users can view their own edit requests"
  ON edit_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own edit requests
CREATE POLICY "Users can create edit requests"
  ON edit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all edit requests
CREATE POLICY "Admins can view all edit requests"
  ON edit_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update edit requests
CREATE POLICY "Admins can update edit requests"
  ON edit_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_edit_requests_user_id ON edit_requests(user_id);
CREATE INDEX idx_edit_requests_status ON edit_requests(status);
CREATE INDEX idx_edit_requests_created_at ON edit_requests(created_at DESC);

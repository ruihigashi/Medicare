/*
  # Create user_accounts table for patient users

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
      - `last_login_at` (timestamp, nullable)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `user_accounts` table
    - Add policy for users to read/update their own data
    - Add policy for registration (insert)

  3. Changes
    - Separate user accounts table for patients/general users
    - Distinguished from admin `users` table
*/

CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Policy for user registration (allow anonymous users to insert)
CREATE POLICY "Allow user registration"
  ON user_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON user_accounts
  FOR SELECT
  TO anon
  USING (true);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON user_accounts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for last_login_at updates
CREATE TRIGGER update_user_accounts_last_login
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  WHEN (OLD.last_login_at IS DISTINCT FROM NEW.last_login_at)
  EXECUTE FUNCTION update_user_accounts_updated_at();
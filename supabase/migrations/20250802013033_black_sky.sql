/*
  # Fix RLS policies for user registration

  1. Security Updates
    - Add policy for anonymous users to insert new accounts
    - Ensure proper RLS policies for user_accounts table
    - Allow public registration while maintaining security

  2. Changes
    - Add INSERT policy for anonymous users on user_accounts
    - Update existing policies to be more permissive for registration
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own account" ON user_accounts;

-- Allow anonymous users to insert new accounts (for registration)
CREATE POLICY "Allow anonymous registration"
  ON user_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read their own account
CREATE POLICY "Users can read own account"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Allow authenticated users to update their own account
CREATE POLICY "Users can update own account"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Ensure the patients table policies work with custom auth
DROP POLICY IF EXISTS "Users can read own patient data" ON patients;
DROP POLICY IF EXISTS "Users can insert own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;

-- Allow authenticated users to manage their patient data
CREATE POLICY "Users can read own patient data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own patient data"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own patient data"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);
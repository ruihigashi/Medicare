/*
  # Fix user_accounts RLS policy for registration

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Create new policy allowing anonymous users to register
    - Ensure authenticated users can read/update their own data

  This migration fixes the RLS policy violation that prevents user registration
  by allowing anonymous users to insert new accounts during the registration process.
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow anonymous registration" ON user_accounts;
DROP POLICY IF EXISTS "Users can read own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own account" ON user_accounts;

-- Allow anonymous users to register (insert new accounts)
CREATE POLICY "Enable insert for anonymous users during registration"
  ON user_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read their own account data
CREATE POLICY "Users can read own account data"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);

-- Allow authenticated users to update their own account data
CREATE POLICY "Users can update own account data"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);
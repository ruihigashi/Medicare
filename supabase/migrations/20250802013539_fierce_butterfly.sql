/*
  # Fix RLS policies for user authentication

  1. Security
    - Enable RLS on user_accounts table
    - Allow anonymous users to register (INSERT)
    - Allow authenticated users to read their own data
    - Allow authenticated users to update their own data
  
  2. Changes
    - Drop existing conflicting policies
    - Create proper policies for registration and data access
    - Ensure auth.uid() function works correctly
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Enable insert for anonymous users during registration" ON user_accounts;
DROP POLICY IF EXISTS "Users can read own account data" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own account data" ON user_accounts;
DROP POLICY IF EXISTS "Allow logged-in users to read their data" ON user_accounts;
DROP POLICY IF EXISTS "Allow logged-in users to insert their own data" ON user_accounts;

-- Ensure RLS is enabled
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to register (INSERT new accounts)
CREATE POLICY "Allow user registration"
  ON user_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);

-- Policy 3: Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- Also fix patients table policies
DROP POLICY IF EXISTS "Users can insert own patient data" ON patients;
DROP POLICY IF EXISTS "Users can read own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;

-- Ensure RLS is enabled on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy for patients: Allow authenticated users to manage their patient data
CREATE POLICY "Users can manage own patient data"
  ON patients
  FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);
/*
  # Update RLS policy for patients table

  1. Security
    - Drop existing policy that uses user_accounts table
    - Create new policy that uses Supabase auth.uid()
    - Allow authenticated users to manage their own patient data
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own patient data" ON patients;

-- Create new policy using Supabase auth
CREATE POLICY "Allow authenticated users to manage their own patient data"
  ON patients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
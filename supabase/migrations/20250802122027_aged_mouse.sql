/*
  # Update patients table foreign key reference

  1. Changes
    - Update patients table user_id foreign key to reference user_accounts instead of users
    - This allows patients to be linked to user_accounts (general users) rather than admin users

  2. Security
    - Update RLS policy to work with user_accounts
*/

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'patients_user_id_fkey' 
    AND table_name = 'patients'
  ) THEN
    ALTER TABLE patients DROP CONSTRAINT patients_user_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraint to reference user_accounts
ALTER TABLE patients 
ADD CONSTRAINT patients_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE;

-- Update RLS policy to work with user_accounts
DROP POLICY IF EXISTS "Users can manage own patient data" ON patients;

CREATE POLICY "Users can manage own patient data"
  ON patients
  FOR ALL
  TO anon
  USING (user_id::text IN (
    SELECT id::text FROM user_accounts WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id::text IN (
    SELECT id::text FROM user_accounts WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));
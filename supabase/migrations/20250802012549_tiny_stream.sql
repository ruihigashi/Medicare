/*
  # ユーザーアカウントと患者情報テーブルの作成

  1. 新しいテーブル
    - `user_accounts`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
      - `last_login_at` (timestamp)
    - `patients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `birth_date` (date)
      - `gender` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `insurance_type` (text)
      - `insurance_number` (text)
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `emergency_contact_relationship` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. セキュリティ
    - RLSを有効化
    - ユーザーは自分のデータのみアクセス可能
*/

-- ユーザーアカウントテーブル
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

-- 患者情報テーブル
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  insurance_type text NOT NULL DEFAULT '国民健康保険',
  insurance_number text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  emergency_contact_relationship text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- ユーザーアカウントのポリシー
CREATE POLICY "Users can read own account"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own account"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 患者情報のポリシー
CREATE POLICY "Users can read own patient data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own patient data"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own patient data"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
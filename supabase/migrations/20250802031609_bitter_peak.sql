/*
  # グループ診療システムのテーブル作成

  1. New Tables
    - `consultation_groups`
      - `id` (uuid, primary key)
      - `doctor_id` (uuid)
      - `doctor_name` (text)
      - `department` (text)
      - `symptom_category` (text) - 症状カテゴリ
      - `symptom_keywords` (text[]) - 症状キーワード配列
      - `status` (text) - waiting, in_progress, completed
      - `scheduled_time` (timestamptz)
      - `max_patients` (integer) - 最大患者数
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `patient_id` (uuid, foreign key)
      - `appointment_id` (uuid, foreign key)
      - `questionnaire_summary` (jsonb) - 問診結果サマリー
      - `priority_level` (integer) - 優先度レベル
      - `joined_at` (timestamptz)
    
    - `group_consultations`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `doctor_id` (uuid)
      - `ai_avatar_summary` (text) - AIアバターが作成した全体サマリー
      - `doctor_diagnosis` (text) - 医師の診断
      - `treatment_recommendations` (jsonb) - 治療推奨事項
      - `individual_notes` (jsonb) - 個別患者への注意事項
      - `consultation_transcript` (text) - 診療記録
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and doctors
</sql>

CREATE TABLE IF NOT EXISTS consultation_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  doctor_name text NOT NULL,
  department text NOT NULL,
  symptom_category text NOT NULL,
  symptom_keywords text[] DEFAULT '{}',
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  scheduled_time timestamptz NOT NULL,
  max_patients integer DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES consultation_groups(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  questionnaire_summary jsonb DEFAULT '{}',
  priority_level integer DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES consultation_groups(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  ai_avatar_summary text,
  doctor_diagnosis text,
  treatment_recommendations jsonb DEFAULT '{}',
  individual_notes jsonb DEFAULT '{}',
  consultation_transcript text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consultation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultation_groups
CREATE POLICY "Anyone can view consultation groups"
  ON consultation_groups
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can manage consultation groups"
  ON consultation_groups
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for group_members
CREATE POLICY "Users can view group members"
  ON group_members
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can manage group members"
  ON group_members
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for group_consultations
CREATE POLICY "Users can view group consultations"
  ON group_consultations
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can manage group consultations"
  ON group_consultations
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Update trigger for consultation_groups
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultation_groups_updated_at
  BEFORE UPDATE ON consultation_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
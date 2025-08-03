/*
  # グループ診療システムのデータベーステーブル作成

  1. 新しいテーブル
    - `group_diagnosis_sessions` - グループ診療セッション
    - `questionnaires` - 問診票データ
    - `group_members` - グループメンバー管理
    - `consultation_notes` - 診療記録

  2. セキュリティ
    - 各テーブルでRLSを有効化
    - 適切なポリシーを設定

  3. インデックス
    - パフォーマンス向上のためのインデックス追加
*/

-- グループ診療セッションテーブル（既存のものを拡張）
DO $$
BEGIN
  -- カラムが存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN ai_summary text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'consultation_transcript'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN consultation_transcript text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'individual_diagnoses'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN individual_diagnoses jsonb DEFAULT '{}';
  END IF;
END $$;

-- 問診票テーブルの拡張
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questionnaires' AND column_name = 'conversation_log'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN conversation_log jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questionnaires' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN ai_analysis jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questionnaires' AND column_name = 'priority_score'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN priority_score integer DEFAULT 1;
  END IF;
END $$;

-- グループメンバー管理テーブル
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_session_id uuid REFERENCES group_diagnosis_sessions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  priority_level integer DEFAULT 1,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed')),
  joined_at timestamptz DEFAULT now(),
  consultation_order integer,
  individual_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 診療記録テーブル
CREATE TABLE IF NOT EXISTS consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_session_id uuid REFERENCES group_diagnosis_sessions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES healthcare_workers(id) ON DELETE SET NULL,
  diagnosis text,
  treatment_plan text,
  prescription_data jsonb DEFAULT '{}',
  follow_up_instructions text,
  consultation_duration integer, -- in minutes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSの有効化
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- group_membersのポリシー
CREATE POLICY "Healthcare workers can manage group members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_workers hw
      WHERE hw.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their own group membership"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.user_id = auth.uid() AND p.id = group_members.patient_id
    )
  );

-- consultation_notesのポリシー
CREATE POLICY "Healthcare workers can manage consultation notes"
  ON consultation_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_workers hw
      WHERE hw.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their own consultation notes"
  ON consultation_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.user_id = auth.uid() AND p.id = consultation_notes.patient_id
    )
  );

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_group_members_session_id ON group_members(group_session_id);
CREATE INDEX IF NOT EXISTS idx_group_members_patient_id ON group_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_members_priority ON group_members(priority_level DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_session_id ON consultation_notes(group_session_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient_id ON consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);

CREATE INDEX IF NOT EXISTS idx_questionnaires_priority ON questionnaires(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created_at ON questionnaires(created_at DESC);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_group_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_members_updated_at();

CREATE OR REPLACE FUNCTION update_consultation_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultation_notes_updated_at
  BEFORE UPDATE ON consultation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_notes_updated_at();
/*
  # グループ診療システムのテーブル作成

  1. 新しいテーブル
    - `group_members` - グループメンバー管理
    - `consultation_notes` - 診療記録

  2. 既存テーブルの拡張
    - `questionnaires` - 会話ログ、AI分析、優先度スコア追加
    - `group_diagnosis_sessions` - AI要約、診療記録追加

  3. セキュリティ
    - 各テーブルでRLS有効化
    - 適切な権限ポリシー設定

  4. パフォーマンス
    - 必要なインデックス追加
*/

-- questionnaires テーブルに新しいカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  -- conversation_log カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questionnaires' AND column_name = 'conversation_log'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN conversation_log jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- ai_analysis カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questionnaires' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN ai_analysis jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- priority_score カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questionnaires' AND column_name = 'priority_score'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN priority_score integer DEFAULT 1;
  END IF;
END $$;

-- group_diagnosis_sessions テーブルに新しいカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  -- ai_summary カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN ai_summary text;
  END IF;

  -- consultation_transcript カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'consultation_transcript'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN consultation_transcript text;
  END IF;

  -- individual_diagnoses カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_diagnosis_sessions' AND column_name = 'individual_diagnoses'
  ) THEN
    ALTER TABLE group_diagnosis_sessions ADD COLUMN individual_diagnoses jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- group_members テーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_session_id uuid NOT NULL REFERENCES group_diagnosis_sessions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  priority_level integer DEFAULT 1,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed')),
  joined_at timestamptz DEFAULT now(),
  consultation_order integer,
  individual_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- group_members テーブルのRLSを有効化
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- group_members テーブルのポリシーを作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'group_members' AND policyname = 'Healthcare workers can manage group members'
  ) THEN
    CREATE POLICY "Healthcare workers can manage group members"
      ON group_members
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM healthcare_workers 
          WHERE healthcare_workers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM healthcare_workers 
          WHERE healthcare_workers.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'group_members' AND policyname = 'Patients can view their own group membership'
  ) THEN
    CREATE POLICY "Patients can view their own group membership"
      ON group_members
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM patients 
          WHERE patients.id = group_members.patient_id 
          AND patients.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- consultation_notes テーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_session_id uuid NOT NULL REFERENCES group_diagnosis_sessions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES healthcare_workers(id) ON DELETE CASCADE,
  diagnosis text NOT NULL,
  treatment_plan text NOT NULL,
  prescription_data jsonb DEFAULT '{}'::jsonb,
  follow_up_instructions text,
  consultation_duration integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- consultation_notes テーブルのRLSを有効化
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- consultation_notes テーブルのポリシーを作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'consultation_notes' AND policyname = 'Healthcare workers can manage consultation notes'
  ) THEN
    CREATE POLICY "Healthcare workers can manage consultation notes"
      ON consultation_notes
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM healthcare_workers 
          WHERE healthcare_workers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM healthcare_workers 
          WHERE healthcare_workers.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'consultation_notes' AND policyname = 'Patients can view their own consultation notes'
  ) THEN
    CREATE POLICY "Patients can view their own consultation notes"
      ON consultation_notes
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM patients 
          WHERE patients.id = consultation_notes.patient_id 
          AND patients.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- インデックスを作成（存在しない場合のみ）
DO $$
BEGIN
  -- group_members テーブルのインデックス
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'group_members' AND indexname = 'idx_group_members_session_id'
  ) THEN
    CREATE INDEX idx_group_members_session_id ON group_members(group_session_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'group_members' AND indexname = 'idx_group_members_patient_id'
  ) THEN
    CREATE INDEX idx_group_members_patient_id ON group_members(patient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'group_members' AND indexname = 'idx_group_members_priority'
  ) THEN
    CREATE INDEX idx_group_members_priority ON group_members(priority_level DESC);
  END IF;

  -- consultation_notes テーブルのインデックス
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'consultation_notes' AND indexname = 'idx_consultation_notes_session_id'
  ) THEN
    CREATE INDEX idx_consultation_notes_session_id ON consultation_notes(group_session_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'consultation_notes' AND indexname = 'idx_consultation_notes_patient_id'
  ) THEN
    CREATE INDEX idx_consultation_notes_patient_id ON consultation_notes(patient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'consultation_notes' AND indexname = 'idx_consultation_notes_doctor_id'
  ) THEN
    CREATE INDEX idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);
  END IF;

  -- questionnaires テーブルの新しいインデックス
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questionnaires' AND indexname = 'idx_questionnaires_priority_score'
  ) THEN
    CREATE INDEX idx_questionnaires_priority_score ON questionnaires(priority_score DESC);
  END IF;
END $$;

-- 更新トリガー関数を作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_group_members_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_group_members_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_consultation_notes_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_consultation_notes_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- 更新トリガーを作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_group_members_updated_at'
  ) THEN
    CREATE TRIGGER update_group_members_updated_at
      BEFORE UPDATE ON group_members
      FOR EACH ROW
      EXECUTE FUNCTION update_group_members_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_consultation_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_consultation_notes_updated_at
      BEFORE UPDATE ON consultation_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_consultation_notes_updated_at();
  END IF;
END $$;
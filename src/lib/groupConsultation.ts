import { supabase } from './supabase';
import { ConsultationGroup, GroupMember, GroupConsultation, QuestionnaireReport, Patient, Appointment } from '../types';

// 問診票をデータベースに保存
export const saveQuestionnaireToDatabase = async (
  report: QuestionnaireReport,
  patient: Patient,
  appointment: Appointment
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('questionnaires')
      .insert({
        patient_id: patient.id,
        symptoms: [report.summary.mainSymptoms],
        severity: report.summary.severity.includes('重度') ? 'severe' : 
                 report.summary.severity.includes('中等度') ? 'moderate' : 'mild',
        duration: report.summary.duration,
        category: categorizeSymptoms(appointment.symptoms),
        conversation_log: report.responses.map(r => ({
          question: r.questionId,
          answer: r.answer,
          timestamp: r.timestamp
        })),
        ai_analysis: report.summary,
        priority_score: calculatePriority(report),
        submitted_at: report.generatedAt
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving questionnaire:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in saveQuestionnaireToDatabase:', error);
    return null;
  }
};

// グループ診療セッションをデータベースに保存
export const saveGroupSessionToDatabase = async (
  group: ConsultationGroup,
  category: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('group_diagnosis_sessions')
      .insert({
        title: `${category}グループ診療`,
        category: category,
        doctor_id: group.doctorId,
        scheduled_time: group.scheduledTime,
        duration: 30, // デフォルト30分
        max_patients: group.maxPatients,
        status: 'scheduled'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving group session:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in saveGroupSessionToDatabase:', error);
    return null;
  }
};

// グループメンバーをデータベースに保存
export const saveGroupMemberToDatabase = async (
  groupSessionId: string,
  patientId: string,
  questionnaireId: string,
  priorityLevel: number
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_session_id: groupSessionId,
        patient_id: patientId,
        questionnaire_id: questionnaireId,
        priority_level: priorityLevel,
        status: 'waiting'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving group member:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in saveGroupMemberToDatabase:', error);
    return null;
  }
};

// データベースからグループ情報を取得
export const getGroupSessionFromDatabase = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_diagnosis_sessions')
      .select(`
        *,
        healthcare_workers(name, specialty),
        group_members(
          *,
          patients(name, birth_date, gender),
          questionnaires(symptoms, severity, ai_analysis, priority_score)
        )
      `)
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error getting group session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getGroupSessionFromDatabase:', error);
    return null;
  }
};

// 医師用：担当グループ一覧を取得
export const getDoctorGroups = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_diagnosis_sessions')
      .select(`
        *,
        group_members(
          count,
          patients(name),
          questionnaires(severity, priority_score)
        )
      `)
      .eq('doctor_id', doctorId)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error getting doctor groups:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getDoctorGroups:', error);
    return [];
  }
};

// 診療記録を保存
export const saveConsultationNotes = async (
  groupSessionId: string,
  patientId: string,
  doctorId: string,
  diagnosis: string,
  treatmentPlan: string,
  prescriptionData: any
) => {
  try {
    const { data, error } = await supabase
      .from('consultation_notes')
      .insert({
        group_session_id: groupSessionId,
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis,
        treatment_plan: treatmentPlan,
        prescription_data: prescriptionData
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving consultation notes:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveConsultationNotes:', error);
    return null;
  }
};

// 症状カテゴリの分類
export const categorizeSymptoms = (symptoms: string, additionalSymptoms?: string): string => {
  const allSymptoms = `${symptoms} ${additionalSymptoms || ''}`.toLowerCase();
  
  // 症状キーワードによる分類
  if (allSymptoms.includes('発熱') || allSymptoms.includes('熱') || allSymptoms.includes('咳') || allSymptoms.includes('のど')) {
    return '呼吸器・感染症';
  } else if (allSymptoms.includes('腹痛') || allSymptoms.includes('胃痛') || allSymptoms.includes('下痢') || allSymptoms.includes('便秘')) {
    return '消化器';
  } else if (allSymptoms.includes('頭痛') || allSymptoms.includes('めまい') || allSymptoms.includes('不安') || allSymptoms.includes('うつ')) {
    return '神経・精神';
  } else if (allSymptoms.includes('皮膚') || allSymptoms.includes('かゆみ') || allSymptoms.includes('湿疹')) {
    return '皮膚科';
  } else if (allSymptoms.includes('関節') || allSymptoms.includes('腰痛') || allSymptoms.includes('筋肉')) {
    return '整形外科';
  } else {
    return '一般内科';
  }
};

// 症状の重要度を計算
export const calculatePriority = (report: QuestionnaireReport): number => {
  const { summary } = report;
  let priority = 1;
  
  // 重症度による優先度
  if (summary.severity.includes('重度') || summary.severity.includes('激しい')) {
    priority += 3;
  } else if (summary.severity.includes('中等度')) {
    priority += 2;
  }
  
  // 症状の持続期間による優先度
  if (summary.duration.includes('1ヶ月') || summary.duration.includes('それ以上')) {
    priority += 2;
  } else if (summary.duration.includes('1週間')) {
    priority += 1;
  }
  
  // 特定の症状による優先度
  if (summary.mainSymptoms.includes('胸の痛み') || summary.mainSymptoms.includes('息苦しさ')) {
    priority += 3;
  }
  
  return Math.min(priority, 5); // 最大5
};

// 適切なグループを見つけるか新規作成
export const findOrCreateConsultationGroup = async (
  report: QuestionnaireReport,
  appointment: Appointment
): Promise<ConsultationGroup | null> => {
  try {
    const category = categorizeSymptoms(appointment.symptoms);
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 60 * 1000); // 1分後
    
    // AIが最適な医師を自動選択
    const selectedDoctor = selectOptimalDoctor(category, report);
    
    // 既存のグループを検索（同じ症状カテゴリ、待機中、定員未満）
    const { data: existingGroups, error: searchError } = await supabase
      .from('consultation_groups')
      .select(`
        *,
        group_members(count)
      `)
      .eq('symptom_category', category)
      .eq('status', 'waiting')
      .eq('department', selectedDoctor.department)
      .lt('scheduled_time', new Date(now.getTime() + 2 * 60 * 1000).toISOString()) // 2分以内
      .order('scheduled_time', { ascending: true });

    if (searchError) {
      console.error('Error searching groups:', searchError);
    }

    // 定員に空きがあるグループを探す
    const availableGroup = existingGroups?.find(group => {
      const memberCount = Array.isArray(group.group_members) ? group.group_members.length : 0;
      return memberCount < group.max_patients;
    });

    if (availableGroup) {
      return {
        id: availableGroup.id,
        doctorId: availableGroup.doctor_id,
        doctorName: availableGroup.doctor_name,
        department: availableGroup.department,
        symptomCategory: availableGroup.symptom_category,
        symptomKeywords: availableGroup.symptom_keywords || [],
        status: availableGroup.status as 'waiting' | 'in_progress' | 'completed',
        scheduledTime: availableGroup.scheduled_time,
        maxPatients: availableGroup.max_patients,
        createdAt: new Date(availableGroup.created_at),
        updatedAt: new Date(availableGroup.updated_at)
      };
    }

    // 新しいグループを作成
    const { data: newGroup, error: createError } = await supabase
      .from('consultation_groups')
      .insert({
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        department: selectedDoctor.department,
        symptom_category: category,
        symptom_keywords: [category],
        scheduled_time: scheduledTime.toISOString(),
        max_patients: 8
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating group:', createError);
      return null;
    }

    return {
      id: newGroup.id,
      doctorId: newGroup.doctor_id,
      doctorName: newGroup.doctor_name,
      department: newGroup.department,
      symptomCategory: newGroup.symptom_category,
      symptomKeywords: newGroup.symptom_keywords || [],
      status: newGroup.status as 'waiting' | 'in_progress' | 'completed',
      scheduledTime: newGroup.scheduled_time,
      maxPatients: newGroup.max_patients,
      createdAt: new Date(newGroup.created_at),
      updatedAt: new Date(newGroup.updated_at)
    };
  } catch (error) {
    console.error('Error in findOrCreateConsultationGroup:', error);
    return null;
  }
};

// AIが症状に基づいて最適な医師を選択
const selectOptimalDoctor = (category: string, report: QuestionnaireReport) => {
  // 症状カテゴリに基づいて最適な医師を選択
  const doctorDatabase = [
    {
      id: 'dr_001',
      name: '田中 一郎',
      department: '内科',
      specialties: ['呼吸器・感染症', '一般内科'],
      experience: 15,
      rating: 4.8
    },
    {
      id: 'dr_002',
      name: '佐藤 美香',
      department: '皮膚科',
      specialties: ['皮膚科'],
      experience: 12,
      rating: 4.9
    },
    {
      id: 'dr_003',
      name: '山田 健太',
      department: '整形外科',
      specialties: ['整形外科'],
      experience: 20,
      rating: 4.7
    },
    {
      id: 'dr_004',
      name: '鈴木 花子',
      department: '消化器内科',
      specialties: ['消化器'],
      experience: 18,
      rating: 4.8
    },
    {
      id: 'dr_005',
      name: '高橋 太郎',
      department: '神経内科',
      specialties: ['神経・精神'],
      experience: 22,
      rating: 4.9
    }
  ];

  // 症状カテゴリに最も適した医師を選択
  const suitableDoctors = doctorDatabase.filter(doctor => 
    doctor.specialties.includes(category)
  );

  if (suitableDoctors.length > 0) {
    // 評価と経験を考慮して最適な医師を選択
    return suitableDoctors.sort((a, b) => {
      const scoreA = a.rating * 0.6 + (a.experience / 30) * 0.4;
      const scoreB = b.rating * 0.6 + (b.experience / 30) * 0.4;
      return scoreB - scoreA;
    })[0];
  }

  // 該当する専門医がいない場合は一般内科医を選択
  return doctorDatabase.find(doctor => doctor.department === '内科') || doctorDatabase[0];
};

// グループにメンバーを追加
export const addMemberToGroup = async (
  groupId: string,
  patientId: string,
  appointmentId: string,
  report: QuestionnaireReport
): Promise<GroupMember | null> => {
  try {
    const priority = calculatePriority(report);
    
    const { data: member, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        patient_id: patientId,
        appointment_id: appointmentId,
        questionnaire_summary: report.summary,
        priority_level: priority
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding member to group:', error);
      return null;
    }

    return {
      id: member.id,
      groupId: member.group_id,
      patientId: member.patient_id,
      appointmentId: member.appointment_id,
      questionnaireSummary: member.questionnaire_summary,
      priorityLevel: member.priority_level,
      joinedAt: new Date(member.joined_at)
    };
  } catch (error) {
    console.error('Error in addMemberToGroup:', error);
    return null;
  }
};

// グループメンバーを取得
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  try {
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        *,
        patients(*)
      `)
      .eq('group_id', groupId)
      .order('priority_level', { ascending: false })
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error getting group members:', error);
      return [];
    }

    return members.map(member => ({
      id: member.id,
      groupId: member.group_id,
      patientId: member.patient_id,
      appointmentId: member.appointment_id,
      questionnaireSummary: member.questionnaire_summary,
      priorityLevel: member.priority_level,
      joinedAt: new Date(member.joined_at),
      patient: member.patients ? {
        id: member.patients.id,
        name: member.patients.name,
        birthDate: member.patients.birth_date,
        gender: member.patients.gender,
        phone: member.patients.phone,
        email: member.patients.email,
        address: member.patients.address,
        insuranceType: member.patients.insurance_type,
        insuranceNumber: member.patients.insurance_number,
        emergencyContact: {
          name: member.patients.emergency_contact_name,
          phone: member.patients.emergency_contact_phone,
          relationship: member.patients.emergency_contact_relationship
        }
      } : undefined
    }));
  } catch (error) {
    console.error('Error in getGroupMembers:', error);
    return [];
  }
};

// AIアバター用のグループサマリーを生成
export const generateGroupSummary = async (groupId: string): Promise<string> => {
  try {
    const members = await getGroupMembers(groupId);
    
    if (members.length === 0) {
      return 'グループにメンバーがいません。';
    }

    // 症状の統計を作成
    const symptomStats: { [key: string]: number } = {};
    const severityStats: { [key: string]: number } = {};
    const durationStats: { [key: string]: number } = {};
    
    members.forEach(member => {
      const summary = member.questionnaireSummary;
      
      // 主な症状の統計
      if (summary.mainSymptoms) {
        const symptoms = summary.mainSymptoms.split('、');
        symptoms.forEach((symptom: string) => {
          const trimmed = symptom.trim();
          symptomStats[trimmed] = (symptomStats[trimmed] || 0) + 1;
        });
      }
      
      // 重症度の統計
      if (summary.severity) {
        severityStats[summary.severity] = (severityStats[summary.severity] || 0) + 1;
      }
      
      // 持続期間の統計
      if (summary.duration) {
        durationStats[summary.duration] = (durationStats[summary.duration] || 0) + 1;
      }
    });

    // サマリーテキストを生成
    const totalPatients = members.length;
    const topSymptoms = Object.entries(symptomStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([symptom, count]) => `${symptom}(${count}名)`)
      .join('、');
    
    const topSeverity = Object.entries(severityStats)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topDuration = Object.entries(durationStats)
      .sort(([,a], [,b]) => b - a)[0];

    return `
【グループ診療サマリー】
総患者数: ${totalPatients}名

主な症状:
${topSymptoms}

重症度分布:
${Object.entries(severityStats).map(([severity, count]) => `${severity}: ${count}名`).join('\n')}

症状持続期間:
${Object.entries(durationStats).map(([duration, count]) => `${duration}: ${count}名`).join('\n')}

高優先度患者:
${members.filter(m => m.priorityLevel >= 4).map(m => `${m.patient?.name}さん (優先度: ${m.priorityLevel})`).join('\n')}

【個別患者情報】
${members.map((member, index) => `
${index + 1}. ${member.patient?.name}さん
   症状: ${member.questionnaireSummary.mainSymptoms}
   重症度: ${member.questionnaireSummary.severity}
   持続期間: ${member.questionnaireSummary.duration}
   現在の服薬: ${member.questionnaireSummary.currentMedications}
   アレルギー: ${member.questionnaireSummary.allergies}
   優先度: ${member.priorityLevel}
`).join('')}
    `.trim();
  } catch (error) {
    console.error('Error generating group summary:', error);
    return 'サマリーの生成に失敗しました。';
  }
};
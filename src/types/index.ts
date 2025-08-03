export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  insuranceNumber: string;
  insuranceType: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'scheduled' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  symptoms: string;
  createdAt: Date;
}

export interface MedicalQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'scale' | 'boolean';
  options?: string[];
  required: boolean;
  category: 'symptoms' | 'history' | 'lifestyle' | 'current_condition';
}

export interface QuestionnaireResponse {
  questionId: string;
  answer: string | number | boolean;
  timestamp: Date;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'avatar';
  timestamp: Date;
  questionId?: string;
  isQuestionnaireRelated?: boolean;
}

export interface QuestionnaireReport {
  id: string;
  patientId: string;
  appointmentId: string;
  responses: QuestionnaireResponse[];
  summary: {
    mainSymptoms: string;
    duration: string;
    severity: string;
    currentMedications: string;
    allergies: string;
    previousTreatment: string;
    additionalNotes: string;
  };
  generatedAt: Date;
  sentToDoctorAt?: Date;
}

export interface DatabaseQuestionnaireRecord {
  id: string;
  patient_id: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  category: string;
  conversation_log: any[];
  ai_analysis: any;
  priority_score: number;
  submitted_at: string;
  assigned_doctor_id?: string;
  group_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGroupSession {
  id: string;
  title: string;
  category: string;
  doctor_id: string;
  scheduled_time: string;
  duration: number;
  max_patients: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  ai_summary?: string;
  consultation_transcript?: string;
  individual_diagnoses?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGroupMember {
  id: string;
  group_session_id: string;
  patient_id: string;
  questionnaire_id: string;
  priority_level: number;
  status: 'waiting' | 'in_consultation' | 'completed';
  joined_at: string;
  consultation_order?: number;
  individual_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConsultationNote {
  id: string;
  group_session_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment_plan: string;
  prescription_data: any;
  follow_up_instructions?: string;
  consultation_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface ConsultationGroup {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  symptomCategory: string;
  symptomKeywords: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  scheduledTime: string;
  maxPatients: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  patientId: string;
  appointmentId: string;
  questionnaireSummary: any;
  priorityLevel: number;
  joinedAt: Date;
  patient?: Patient;
  appointment?: Appointment;
}

export interface GroupConsultation {
  id: string;
  groupId: string;
  doctorId: string;
  aiAvatarSummary?: string;
  doctorDiagnosis?: string;
  treatmentRecommendations: any;
  individualNotes: any;
  consultationTranscript?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  experience: number;
  rating: number;
  availableSlots: string[];
}

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  lastLoginAt?: Date;
  patientInfo?: Patient;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
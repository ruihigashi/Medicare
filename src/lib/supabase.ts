import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Create a mock client for development
const createMockClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null })
  })
});

export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Database types
export interface UserAccount {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  last_login_at?: string;
}

export interface PatientData {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  insurance_type: string;
  insurance_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  created_at: string;
  updated_at: string;
}
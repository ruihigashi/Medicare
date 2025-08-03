import { supabase } from './supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_login_at?: string;
  is_active: boolean;
}

// ユーザー登録
export const registerUser = async (data: RegisterData): Promise<{ user: AuthUser | null; error: string | null }> => {
  try {
    // Supabaseの認証を使用してユーザー登録
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error('Registration error:', authError);
      if (authError.message.includes('already registered')) {
        return { user: null, error: 'このメールアドレスは既に登録されています' };
      }
      return { user: null, error: 'アカウントの作成に失敗しました' };
    }

    if (!authData.user) {
      return { user: null, error: 'アカウントの作成に失敗しました' };
    }

    // user_accountsテーブルにも記録を作成
    const { error: dbError } = await supabase
      .from('user_accounts')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        password_hash: '', // Supabaseが管理するため空文字
        is_active: true
      });

    if (dbError) {
      console.error('Failed to create user_accounts record:', dbError);
      // 認証ユーザーは作成されているので、エラーは無視して続行
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        last_login_at: null,
        is_active: true
      },
      error: null
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: 'アカウントの作成に失敗しました' };
  }
};

// ログイン
export const loginUser = async (credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> => {
  try {
    // Supabaseの認証を使用してログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      console.error('Login error:', authError);
      if (authError.message.includes('Invalid login credentials') || authError.message.includes('invalid_credentials')) {
        return { user: null, error: 'メールアドレスまたはパスワードが正しくありません。アカウントをお持ちでない場合は「新規登録」タブからアカウントを作成してください。' };
      }
      if (authError.message.includes('Email not confirmed')) {
        return { user: null, error: 'メールアドレスの確認が完了していません。確認メールをご確認ください。' };
      }
      return { user: null, error: 'ログインに失敗しました' };
    }

    if (!authData.user) {
      return { user: null, error: 'ログインに失敗しました' };
    }

    // user_accountsテーブルの最終ログイン時刻を更新
    const { error: updateError } = await supabase
      .from('user_accounts')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        password_hash: '',
        last_login_at: new Date().toISOString(),
        is_active: true
      });

    if (updateError) {
      console.error('Failed to update last login:', updateError);
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        last_login_at: new Date().toISOString(),
        is_active: true
      },
      error: null
    };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'ログインに失敗しました' };
  }
};

// 患者情報を保存
export const savePatientData = async (userId: string, patientData: any) => {
  try {
    // 現在の認証ユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return { data: null, error: 'ログインが必要です' };
    }

    // 患者情報を保存（認証されたユーザーのIDを使用）
    const { data, error } = await supabase
      .from('patients')
      .upsert({
        user_id: user.id, // 認証されたユーザーのIDを使用
        name: patientData.name,
        birth_date: patientData.birthDate || patientData.birth_date,
        gender: patientData.gender,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        insurance_type: patientData.insuranceType || patientData.insurance_type,
        insurance_number: patientData.insuranceNumber || patientData.insurance_number,
        emergency_contact_name: patientData.emergencyContact?.name || patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergencyContact?.phone || patientData.emergency_contact_phone,
        emergency_contact_relationship: patientData.emergencyContact?.relationship || patientData.emergency_contact_relationship
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save patient data:', error);
      return { data: null, error: '患者情報の保存に失敗しました' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Save patient data error:', error);
    return { data: null, error: '患者情報の保存に失敗しました' };
  }
};

// 患者情報を取得
export const getPatientData = async (userId: string) => {
  try {
    // 現在の認証ユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return { data: null, error: 'ログインが必要です' };
    }

    // 患者情報を取得（認証されたユーザーのIDを使用）
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get patient data:', error);
      return { data: null, error: '患者情報の取得に失敗しました' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get patient data error:', error);
    return { data: null, error: '患者情報の取得に失敗しました' };
  }
};

// ログアウト
export const logoutUser = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      return { error: 'ログアウトに失敗しました' };
    }
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'ログアウトに失敗しました' };
  }
};
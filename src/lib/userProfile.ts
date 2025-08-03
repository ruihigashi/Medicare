import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferences?: any;
}

// ユーザープロフィールを取得
export const getUserProfile = async (): Promise<{ data: UserProfile | null; error: string | null }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: 'ログインが必要です' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get user profile:', error);
      return { data: null, error: 'プロフィールの取得に失敗しました' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { data: null, error: 'プロフィールの取得に失敗しました' };
  }
};

// ユーザープロフィールを保存・更新
export const saveUserProfile = async (profileData: UserProfileInput): Promise<{ data: UserProfile | null; error: string | null }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: 'ログインが必要です' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profileData
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save user profile:', error);
      return { data: null, error: 'プロフィールの保存に失敗しました' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Save user profile error:', error);
    return { data: null, error: 'プロフィールの保存に失敗しました' };
  }
};

// ユーザープロフィールを削除
export const deleteUserProfile = async (): Promise<{ error: string | null }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'ログインが必要です' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete user profile:', error);
      return { error: 'プロフィールの削除に失敗しました' };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete user profile error:', error);
    return { error: 'プロフィールの削除に失敗しました' };
  }
};
import React, { useState, useEffect } from 'react';
import { User, Heart, LogIn, ArrowLeft, Edit, CheckCircle, Calendar, Phone, Mail, MapPin, CreditCard, FileText, Settings } from 'lucide-react';
import { AuthUser, getPatientData } from '../lib/auth';
import { getUserProfile, saveUserProfile, UserProfile } from '../lib/userProfile';
import PatientProfileForm from './PatientProfileForm';

interface ProfilePageProps {
  userAccount: AuthUser;
  onShowLogin: () => void;
  onLogout: () => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  userAccount,
  onShowLogin,
  onLogout,
  onBack
}) => {
  const [patientData, setPatientData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
    loadUserProfile();
  }, [userAccount.id]);

  const loadPatientData = async () => {
    try {
      const { data } = await getPatientData(userAccount.id);
      setPatientData(data);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data } = await getUserProfile();
      setUserProfile(data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleProfileUpdate = (updatedData: any) => {
    setPatientData(updatedData);
    // Reload user profile to get updated data
    loadUserProfile();
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '未設定';
    }
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <span className="ml-3 text-2xl font-bold text-gray-900">MediCare Online</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <User size={16} />
                  <span className="text-sm font-medium">{userAccount.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 text-sm"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">プロフィール編集</h1>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={16} />
                戻る
              </button>
            </div>
            
            <PatientProfileForm
              userAccount={userAccount}
              existingData={patientData}
              onComplete={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">MediCare Online</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <User size={16} />
                <span className="text-sm font-medium">{userAccount.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 text-sm"
              >
                ログアウト
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                <ArrowLeft size={16} />
                トップページ
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="text-white" size={40} />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userProfile?.display_name || patientData?.name || 'プロフィール未設定'}
                </h1>
                <p className="text-gray-600 mt-1">{userAccount.email}</p>
                {userProfile?.bio && (
                  <p className="text-gray-500 text-sm mt-1">{userProfile.bio}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {patientData ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">プロフィール設定済み</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Edit size={16} />
                      <span className="text-sm font-medium">プロフィール未設定</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Edit size={16} />
                プロフィール{patientData ? '編集' : '設定'}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">情報を読み込み中...</p>
          </div>
        ) : patientData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 基本情報 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">基本情報</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">お名前</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.display_name || patientData.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">生年月日</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(userProfile?.date_of_birth || patientData.birth_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">性別</p>
                    <p className="font-medium text-gray-900">
                      {getGenderLabel(userProfile?.gender || patientData.gender)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">電話番号</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.phone || patientData.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">メールアドレス</p>
                    <p className="font-medium text-gray-900">{patientData.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 住所・保険情報 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">住所・保険情報</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-green-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">住所</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.address || patientData.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">保険の種類</p>
                    <p className="font-medium text-gray-900">{patientData.insurance_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">保険証番号</p>
                    <p className="font-medium text-gray-900">{patientData.insurance_number}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 緊急連絡先 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">緊急連絡先</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <User className="text-red-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">お名前</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.emergency_contact_name || patientData?.emergency_contact_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-red-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">電話番号</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.emergency_contact_phone || patientData?.emergency_contact_phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-red-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">続柄</p>
                    <p className="font-medium text-gray-900">
                      {userProfile?.emergency_contact_relationship || patientData?.emergency_contact_relationship}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">プロフィール未設定</h3>
            <p className="text-gray-600 mb-6">
              プロフィール情報を設定すると、診療予約時に自動入力されて便利です
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Edit size={20} />
                プロフィール設定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
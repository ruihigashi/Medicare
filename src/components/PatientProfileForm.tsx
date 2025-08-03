import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, CreditCard, Calendar, Save, X } from 'lucide-react';
import { AuthUser, savePatientData, getPatientData } from '../lib/auth';
import { saveUserProfile } from '../lib/userProfile';

interface PatientProfileFormProps {
  userAccount: AuthUser;
  onComplete: (patientData: any) => void;
  onSkip?: () => void;
  onCancel?: () => void;
  isInitialSetup?: boolean;
  existingData?: any;
}

const PatientProfileForm: React.FC<PatientProfileFormProps> = ({
  userAccount,
  onComplete,
  onSkip,
  onCancel,
  isInitialSetup = false,
  existingData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: userAccount.email,
    address: '',
    insuranceType: '国民健康保険',
    insuranceNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 既存データがある場合は自動入力
    if (existingData) {
      setFormData({
        name: existingData.name || '',
        birthDate: existingData.birth_date || '',
        gender: existingData.gender || '',
        phone: existingData.phone || '',
        email: existingData.email || userAccount.email,
        address: existingData.address || '',
        insuranceType: existingData.insurance_type || '国民健康保険',
        insuranceNumber: existingData.insurance_number || '',
        emergencyContact: {
          name: existingData.emergency_contact_name || '',
          phone: existingData.emergency_contact_phone || '',
          relationship: existingData.emergency_contact_relationship || ''
        }
      });
    }
  }, [existingData, userAccount.email]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const isFormValid = () => {
    return formData.name && formData.birthDate && formData.gender && 
           formData.phone && formData.address && formData.insuranceNumber &&
           formData.emergencyContact.name && formData.emergencyContact.phone && 
           formData.emergencyContact.relationship;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('すべての必須項目を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: saveError } = await savePatientData(userAccount.id, formData);
      
      if (saveError) {
        setError(saveError);
        return;
      }

      // Also save to user_profiles table
      const profileData = {
        display_name: formData.name,
        phone: formData.phone,
        date_of_birth: formData.birthDate,
        gender: formData.gender as 'male' | 'female' | 'other',
        address: formData.address,
        emergency_contact_name: formData.emergencyContact.name,
        emergency_contact_phone: formData.emergencyContact.phone,
        emergency_contact_relationship: formData.emergencyContact.relationship,
      };
      
      await saveUserProfile(profileData);

      onComplete(data);
    } catch (error) {
      console.error('Profile save error:', error);
      setError('プロフィールの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                お名前 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="山田 太郎"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                生年月日 *
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">性別 *</label>
            <div className="flex gap-4">
              {[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2"
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                電話番号 *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="090-1234-5678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>
          </div>
        </div>

        {/* 住所・保険情報 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">住所・保険情報</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              住所 *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              rows={3}
              placeholder="〒123-4567 東京都渋谷区..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">保険の種類 *</label>
              <select
                value={formData.insuranceType}
                onChange={(e) => handleInputChange('insuranceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              >
                <option value="国民健康保険">国民健康保険</option>
                <option value="健康保険">健康保険</option>
                <option value="共済組合">共済組合</option>
                <option value="後期高齢者医療">後期高齢者医療</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard size={16} className="inline mr-2" />
                保険証番号 *
              </label>
              <input
                type="text"
                value={formData.insuranceNumber}
                onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="12345678"
                required
              />
            </div>
          </div>
        </div>

        {/* 緊急連絡先 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">緊急連絡先</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                お名前 *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="山田 花子"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                電話番号 *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="090-1234-5678"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">続柄 *</label>
            <select
              value={formData.emergencyContact.relationship}
              onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            >
              <option value="">選択してください</option>
              <option value="配偶者">配偶者</option>
              <option value="父">父</option>
              <option value="母">母</option>
              <option value="子">子</option>
              <option value="兄弟姉妹">兄弟姉妹</option>
              <option value="その他">その他</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-4 justify-end">
          {isInitialSetup && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              スキップ
            </button>
          )}
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              キャンセル
            </button>
          )}
          
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                {isInitialSetup ? '保存して開始' : '保存'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfileForm;
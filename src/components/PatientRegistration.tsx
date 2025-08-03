import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, CreditCard, UserPlus, Calendar, ArrowLeft, Heart, LogIn } from 'lucide-react';
import { Patient } from '../types';
import { AuthUser } from '../lib/auth';

interface PatientRegistrationProps {
  onRegistrationComplete: (patient: Patient) => void;
  onBack?: () => void;
  selectedSymptoms?: string[];
  additionalSymptoms?: string;
  savedPatientData?: any;
  userAccount?: AuthUser;
  onShowLogin: () => void;
  onLogout: () => void;
}

const PatientRegistration: React.FC<PatientRegistrationProps> = ({ 
  onRegistrationComplete,
  onBack,
  selectedSymptoms,
  additionalSymptoms,
  savedPatientData,
  userAccount,
  onShowLogin,
  onLogout
}) => {
  const [step, setStep] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState(() => {
    // 保存された患者データがある場合は自動入力
    if (savedPatientData) {
      return {
        name: savedPatientData.name || '',
        birthDate: savedPatientData.birth_date || savedPatientData.birthDate || '',
        gender: savedPatientData.gender || '',
        height: savedPatientData.height || '',
        weight: savedPatientData.weight || '',
        bloodType: savedPatientData.blood_type || savedPatientData.bloodType || '',
        phone: savedPatientData.phone || '',
        email: savedPatientData.email || userAccount?.email || '',
        postalCode: savedPatientData.postal_code || savedPatientData.postalCode || '',
        address: savedPatientData.address || '',
        insuranceType: savedPatientData.insurance_type || '国民健康保険',
        insuranceNumber: savedPatientData.insurance_number || savedPatientData.insuranceNumber || '',
        medicalHistory: savedPatientData.medical_history || savedPatientData.medicalHistory || '',
        currentMedications: savedPatientData.current_medications || savedPatientData.currentMedications || '',
        allergies: savedPatientData.allergies || '',
        smokingStatus: savedPatientData.smoking_status || savedPatientData.smokingStatus || 'never',
        drinkingStatus: savedPatientData.drinking_status || savedPatientData.drinkingStatus || 'never',
        emergencyContact: {
          name: savedPatientData.emergency_contact_name || savedPatientData.emergencyContact?.name || '',
          phone: savedPatientData.emergency_contact_phone || savedPatientData.emergencyContact?.phone || '',
          relationship: savedPatientData.emergency_contact_relationship || savedPatientData.emergencyContact?.relationship || ''
        }
      };
    }
    
    return {
      name: '',
      birthDate: '',
      gender: '',
      height: '',
      weight: '',
      bloodType: '',
      phone: '',
      email: userAccount?.email || '',
      postalCode: '',
      address: '',
      insuranceType: '国民健康保険',
      insuranceNumber: '',
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      smokingStatus: 'never',
      drinkingStatus: 'never',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    };
  });
  const [showAutoFillNotification, setShowAutoFillNotification] = useState(!!savedPatientData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Load profile data when user logs in
  React.useEffect(() => {
    if (userAccount && !savedPatientData) {
      loadUserProfile();
    }
  }, [userAccount, savedPatientData]);

  const loadUserProfile = async () => {
    if (!userAccount) return;
    
    setIsLoadingProfile(true);
    try {
      const { getPatientData } = await import('../lib/auth');
      const { data } = await getPatientData(userAccount.id);
      
      if (data) {
        // Auto-fill form with saved profile data
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          birthDate: data.birth_date || data.birthDate || prev.birthDate,
          gender: data.gender || prev.gender,
          height: data.height || prev.height,
          weight: data.weight || prev.weight,
          bloodType: data.blood_type || data.bloodType || prev.bloodType,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          postalCode: data.postal_code || data.postalCode || prev.postalCode,
          address: data.address || prev.address,
          insuranceType: data.insurance_type || prev.insuranceType,
          insuranceNumber: data.insurance_number || data.insuranceNumber || prev.insuranceNumber,
          medicalHistory: data.medical_history || data.medicalHistory || prev.medicalHistory,
          currentMedications: data.current_medications || data.currentMedications || prev.currentMedications,
          allergies: data.allergies || prev.allergies,
          smokingStatus: data.smoking_status || data.smokingStatus || prev.smokingStatus,
          drinkingStatus: data.drinking_status || data.drinkingStatus || prev.drinkingStatus,
          emergencyContact: {
            name: data.emergency_contact_name || data.emergencyContact?.name || prev.emergencyContact.name,
            phone: data.emergency_contact_phone || data.emergencyContact?.phone || prev.emergencyContact.phone,
            relationship: data.emergency_contact_relationship || data.emergencyContact?.relationship || prev.emergencyContact.relationship
          }
        }));
        setShowAutoFillNotification(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // 郵便番号から住所を取得する関数
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    if (!postalCode || postalCode.length < 7) return;
    
    setIsLoadingAddress(true);
    try {
      // 郵便番号をハイフンなしの7桁に正規化
      const normalizedPostalCode = postalCode.replace(/[^\d]/g, '').slice(0, 7);
      
      if (normalizedPostalCode.length === 7) {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedPostalCode}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const fullAddress = `${result.address1}${result.address2}${result.address3}`;
          
          setFormData(prev => ({
            ...prev,
            address: fullAddress
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 自動入力通知を3秒後に非表示
  React.useEffect(() => {
    if (showAutoFillNotification) {
      const timer = setTimeout(() => {
        setShowAutoFillNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAutoFillNotification]);

  const handleInputChange = (field: string, value: string) => {
    // Clear validation errors when user starts typing
    setValidationErrors([]);
    
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
      // 郵便番号の場合はハイフンを自動挿入
      let processedValue = value;
      if (field === 'postalCode') {
        const digitsOnly = value.replace(/[^\d]/g, '');
        if (digitsOnly.length <= 3) {
          processedValue = digitsOnly;
        } else if (digitsOnly.length <= 7) {
          processedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
        } else {
          processedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}`;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: processedValue
      }));
      
      // 郵便番号が入力された場合、住所を自動取得
      if (field === 'postalCode' && processedValue.replace(/[^\d]/g, '').length >= 7) {
        fetchAddressFromPostalCode(processedValue);
      }
    }
  };

  const validateStep = (stepNumber: number) => {
    const errors: string[] = [];
    
    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) errors.push('お名前を入力してください');
        if (!formData.birthDate) errors.push('生年月日を選択してください');
        if (!formData.gender) errors.push('性別を選択してください');
        if (!formData.height) errors.push('身長を入力してください');
        if (!formData.weight) errors.push('体重を入力してください');
        if (!formData.bloodType) errors.push('血液型を選択してください');
        if (!formData.phone.trim()) errors.push('電話番号を入力してください');
        if (!formData.email.trim()) errors.push('メールアドレスを入力してください');
        break;
      case 2:
        if (!formData.address.trim()) errors.push('住所を入力してください');
        if (!formData.insuranceType) errors.push('保険の種類を選択してください');
        if (!formData.insuranceNumber.trim()) errors.push('保険証番号を入力してください');
        break;
      case 3:
        if (!formData.emergencyContact.name.trim()) errors.push('緊急連絡先のお名前を入力してください');
        if (!formData.emergencyContact.phone.trim()) errors.push('緊急連絡先の電話番号を入力してください');
        if (!formData.emergencyContact.relationship) errors.push('緊急連絡先の続柄を選択してください');
        break;
      case 4:
        // 医療情報は任意項目なのでエラーなし
        break;
    }
    
    return errors;
  };

  const isStepValid = (stepNumber: number = step) => {
    const errors = validateStep(stepNumber);
    return errors.length === 0;
  };

  const handleNext = () => {
    const errors = validateStep(step);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    const errors = validateStep(step);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const patient: Patient = {
        id: Date.now().toString(),
        ...formData,
        registrationDate: new Date().toISOString(),
        symptoms: selectedSymptoms || [],
        additionalSymptoms: additionalSymptoms || ''
      };
      onRegistrationComplete(patient);
    }
  };

  const handleBack = () => {
    setValidationErrors([]); // Clear errors when going back
    switch (step) {
      case 1:
        if (onBack) {
          onBack();
        }
        break;
      default:
        setStep(prev => prev - 1);
        break;
    }
  };

  const isStepValidForDisplay = () => {
    switch (step) {
      case 1:
        return formData.name && formData.birthDate && formData.gender && formData.height && formData.weight && formData.bloodType && formData.phone && formData.email;
      case 2:
        return formData.address && formData.insuranceType && formData.insuranceNumber;
      case 3:
        return formData.emergencyContact.name && formData.emergencyContact.phone && formData.emergencyContact.relationship;
      case 4:
        return true; // 医療情報は任意項目なので常にtrue
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">MediCare Online</span>
            </div>
            <div className="flex items-center gap-4">
              {userAccount ? (
                <div className="flex items-center gap-3">
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
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <LogIn size={16} />
                  ログイン
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                  症状選択に戻る
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Loading indicator */}
          {isLoadingProfile && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-blue-800 font-medium">保存されたプロフィール情報を読み込み中...</p>
              </div>
            </div>
          )}

          {/* Auto-fill notification */}
          {showAutoFillNotification && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <p className="text-green-800 font-medium">保存されたプロフィール情報を自動入力しました</p>
              </div>
              <p className="text-green-700 text-sm mt-1">必要に応じて情報を修正してください。次回からも自動入力されます。</p>
            </div>
          )}

          {/* Login promotion for non-logged users */}
          {!userAccount && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-800">ログインして自動入力</h3>
                  <p className="text-blue-700 text-sm">アカウントがあればプロフィール情報を自動入力できます</p>
                </div>
                <button
                  onClick={onShowLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  ログイン
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="text-blue-600 mr-3" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">患者登録</h1>
            </div>
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-12 h-1 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-600">
              {step === 1 && '基本情報を入力してください'}
              {step === 2 && '保険情報を入力してください'}
              {step === 3 && '緊急連絡先を入力してください'}
              {step === 4 && '医療情報を入力してください（任意）'}
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-red-800 mb-2">入力内容をご確認ください</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  お名前 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="山田 太郎"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
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
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📏 身長 *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors pr-12"
                    placeholder="170"
                    min="100"
                    max="250"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚖️ 体重 *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors pr-12"
                    placeholder="65"
                    min="20"
                    max="200"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🩸 血液型 *
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                >
                  <option value="">選択してください</option>
                  <option value="A">A型</option>
                  <option value="B">B型</option>
                  <option value="AB">AB型</option>
                  <option value="O">O型</option>
                  <option value="unknown">不明</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  電話番号 *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="090-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Insurance Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                郵便番号
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="123-4567"
                  maxLength={8}
                />
                {isLoadingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">郵便番号を入力すると住所が自動で入力されます</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                住所 *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                rows={3}
                placeholder="東京都渋谷区..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">保険の種類 *</label>
              <select
                value={formData.insuranceType}
                onChange={(e) => handleInputChange('insuranceType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="12345678"
              />
            </div>
          </div>
        )}

        {/* Step 3: Emergency Contact */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                緊急連絡先 お名前 *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="山田 花子"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                緊急連絡先 電話番号 *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="090-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">続柄 *</label>
              <select
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
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
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValidForDisplay()}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValidForDisplay()}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              登録完了
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default PatientRegistration;